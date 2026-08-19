import "dotenv/config";
import http from "node:http";
import crypto from "node:crypto";

const PORT = Number(process.env.PORT || 8787);
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID || "";
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY || "";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://192.168.3.3:5173",
  FRONTEND_ORIGIN
].filter(Boolean));

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const url = new URL(origin);
    return url.protocol === "http:" && /^192\.168\.\d+\.\d+$/.test(url.hostname) && url.port === "5173";
  } catch {
    return false;
  }
}
const PREMIUM_PRICE = "499.00";

function getCorsOrigin(req) {
  const origin = req.headers.origin || "";
  return isAllowedOrigin(origin) ? origin : FRONTEND_ORIGIN;
}

function json(res, status, body, req = null) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": req ? getCorsOrigin(req) : FRONTEND_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Vary": "Origin"
  });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

function supabaseHeaders() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json"
  };
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: { ...supabaseHeaders(), ...(options.headers || {}) }
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const message = data?.message || data?.hint || data?.error_description || data?.error || "Ошибка Supabase";
    throw new Error(message);
  }
  return data;
}

async function authenticateUser(req) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_NOT_CONFIGURED");
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${token}`
    }
  });
  if (!response.ok) return null;
  return await response.json();
}

async function yookassaRequest(path, { method = "GET", body, idempotenceKey } = {}) {
  const basic = Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString("base64");
  const headers = {
    Authorization: `Basic ${basic}`,
    "Content-Type": "application/json",
    Accept: "application/json"
  };
  if (idempotenceKey) headers["Idempotence-Key"] = idempotenceKey;

  const response = await fetch(`https://api.yookassa.ru/v3${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    throw new Error(data?.description || data?.message || `ЮKassa HTTP ${response.status}`);
  }
  return data;
}

async function createOrFindChart(userId, chart) {
  const query = `/rest/v1/charts?user_id=eq.${encodeURIComponent(userId)}&birth_date=eq.${encodeURIComponent(chart.date)}&birth_time=eq.${encodeURIComponent(chart.time)}&city=eq.${encodeURIComponent(chart.city)}&select=id,premium&limit=1`;
  const existing = await supabaseRequest(query);
  if (existing?.[0]) return existing[0];

  const rows = await supabaseRequest("/rest/v1/charts", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: userId,
      birth_date: chart.date,
      birth_time: chart.time,
      city: chart.city,
      timezone: chart.timezone || null,
      latitude: chart.latitude ?? null,
      longitude: chart.longitude ?? null,
      premium: false
    })
  });
  return rows?.[0];
}

async function markOrderPaid(orderId, payment) {
  const orders = await supabaseRequest(`/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&select=*`);
  const order = orders?.[0];
  if (!order) return false;
  if (order.status === "paid") return true;

  await supabaseRequest(`/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      status: "paid",
      provider_payment_id: payment.id,
      paid_at: new Date().toISOString()
    })
  });

  if (order.chart_id) {
    await supabaseRequest(`/rest/v1/charts?id=eq.${encodeURIComponent(order.chart_id)}&user_id=eq.${encodeURIComponent(order.user_id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ premium: true })
    });
  } else {
    const chartQuery = `/rest/v1/charts?user_id=eq.${encodeURIComponent(order.user_id)}&birth_date=eq.${encodeURIComponent(order.chart_date)}&birth_time=eq.${encodeURIComponent(order.chart_time)}&city=eq.${encodeURIComponent(order.chart_city)}`;
    await supabaseRequest(chartQuery, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ premium: true })
    });
  }

  return true;
}


async function getUserChartPremium(userId, chartParams) {
  if (!userId || !chartParams?.date || !chartParams?.time || !chartParams?.city) return false;
  const query =
    `/rest/v1/charts?user_id=eq.${encodeURIComponent(userId)}` +
    `&birth_date=eq.${encodeURIComponent(chartParams.date)}` +
    `&birth_time=eq.${encodeURIComponent(chartParams.time)}` +
    `&city=eq.${encodeURIComponent(chartParams.city)}` +
    `&select=id,premium&order=created_at.desc&limit=1`;
  const rows = await supabaseRequest(query);
  return Boolean(rows?.[0]?.premium);
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": getCorsOrigin(req),
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Vary": "Origin"
    });
    return res.end();
  }

  try {
    if (req.method === "GET" && req.url === "/api/payment-config") {
      return json(res, 200, {
        ok: true,
        configured: Boolean(YOOKASSA_SHOP_ID && YOOKASSA_SECRET_KEY),
        amountRub: 499,
        provider: "yookassa"
      });
    }

    if (req.method === "GET" && (req.url === "/api/health" || req.url === "/health")) {
      return json(res, 200, {
        ok: true,
        supabaseConfigured: Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY),
        yookassaConfigured: Boolean(YOOKASSA_SHOP_ID && YOOKASSA_SECRET_KEY),
        port: PORT
      });
    }

    if (req.method === "GET" && req.url === "/api/charts") {
      const user = await authenticateUser(req);
      if (!user) return json(res, 401, { ok: false, message: "Необходим вход." }, req);
      const rows = await supabaseRequest(`/rest/v1/charts?user_id=eq.${encodeURIComponent(user.id)}&select=*&order=created_at.desc`);
      return json(res, 200, { ok: true, charts: rows || [] }, req);
    }

    if (req.method === "POST" && req.url === "/api/charts") {
      const user = await authenticateUser(req);
      if (!user) return json(res, 401, { ok: false, message: "Необходим вход." }, req);
      const body = await readBody(req);
      const chart = body?.chart || body;
      if (!chart?.date || !chart?.time || !chart?.city) {
        return json(res, 400, { ok: false, message: "Не переданы данные карты." }, req);
      }
      const existing = await supabaseRequest(
        `/rest/v1/charts?user_id=eq.${encodeURIComponent(user.id)}&birth_date=eq.${encodeURIComponent(chart.date)}&birth_time=eq.${encodeURIComponent(chart.time)}&city=eq.${encodeURIComponent(chart.city)}&select=*&limit=1`
      );
      if (existing?.[0]) return json(res, 200, { ok: true, chart: existing[0] }, req);
      const rows = await supabaseRequest("/rest/v1/charts", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          user_id: user.id,
          birth_date: chart.date,
          birth_time: chart.time,
          city: chart.city,
          timezone: chart.timezone || null,
          latitude: chart.latitude ?? null,
          longitude: chart.longitude ?? null,
          premium: Boolean(chart.premium)
        })
      });
      return json(res, 200, { ok: true, chart: rows?.[0] || null }, req);
    }

    if (req.method === "DELETE" && req.url.startsWith("/api/charts")) {
      const user = await authenticateUser(req);
      if (!user) return json(res, 401, { ok: false, message: "Необходим вход." }, req);
      const url = new URL(req.url, `http://${req.headers.host}`);
      const id = url.searchParams.get("id");
      if (!id) return json(res, 400, { ok: false, message: "Не указан id карты." }, req);
      await supabaseRequest(`/rest/v1/charts?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}`, { method: "DELETE" });
      return json(res, 200, { ok: true }, req);
    }

    if (req.method === "GET" && req.url.startsWith("/api/premium-status")) {
      const user = await authenticateUser(req);
      if (!user) return json(res, 401, { ok: false, message: "Необходим вход." }, req);

      const url = new URL(req.url, `http://${req.headers.host}`);
      const date = url.searchParams.get("date");
      const time = url.searchParams.get("time");
      const city = url.searchParams.get("city");
      if (!date || !time || !city) {
        return json(res, 400, { ok: false, message: "Не переданы данные карты." });
      }

      const premium = await getUserChartPremium(user.id, { date, time, city });
      return json(res, 200, { ok: true, premium });
    }


    if (req.method === "POST" && req.url === "/api/create-payment") {
      if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
        return json(res, 503, {
          ok: false,
          code: "PAYMENT_NOT_CONFIGURED",
          message: "ЮKassa ещё не настроена. Добавьте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в server/.env."
        });
      }

      const user = await authenticateUser(req);
      if (!user) return json(res, 401, { ok: false, message: "Войдите в аккаунт перед покупкой Premium." }, req);

      const body = await readBody(req);
      const chart = body.chart;
      if (!chart?.date || !chart?.time || !chart?.city) {
        return json(res, 400, { ok: false, message: "Не переданы данные текущей натальной карты." });
      }

      const chartRow = await createOrFindChart(user.id, chart);
      if (!chartRow) return json(res, 500, { ok: false, message: "Не удалось сохранить карту перед оплатой." });

      if (chartRow.premium) {
        return json(res, 200, { ok: true, alreadyPremium: true });
      }

      const orderRows = await supabaseRequest("/rest/v1/orders", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          user_id: user.id,
          amount_rub: 499,
          status: "pending",
          provider: "yookassa",
          chart_id: chartRow.id,
          chart_date: chart.date,
          chart_time: chart.time,
          chart_city: chart.city
        })
      });
      const order = orderRows?.[0];
      if (!order) throw new Error("Не удалось создать заказ.");

      const returnOrigin = getCorsOrigin(req);
      const returnUrl = `${returnOrigin}/?astroguide_order=${encodeURIComponent(order.id)}`;
      let payment;
      try {
        payment = await yookassaRequest("/payments", {
          method: "POST",
          idempotenceKey: crypto.randomUUID(),
          body: {
            amount: { value: PREMIUM_PRICE, currency: "RUB" },
            capture: true,
            description: "AstroGuide Premium — полный персональный разбор",
            confirmation: { type: "redirect", return_url: returnUrl },
            metadata: {
              order_id: order.id,
              user_id: user.id,
              chart_id: chartRow.id
            }
          }
        });
      } catch (error) {
        await supabaseRequest(`/rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ status: "cancelled" })
        }).catch(() => {});
        throw error;
      }

      await supabaseRequest(`/rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ provider_payment_id: payment.id })
      });

      if (!payment?.id || !payment?.confirmation?.confirmation_url) {
        throw new Error("ЮKassa не вернула ссылку для оплаты.");
      }

      return json(res, 200, {
        ok: true,
        orderId: order.id,
        paymentId: payment.id,
        confirmationUrl: payment.confirmation.confirmation_url
      });
    }

    if (req.method === "GET" && req.url.startsWith("/api/payment-status")) {
      const user = await authenticateUser(req);
      if (!user) return json(res, 401, { ok: false, message: "Необходим вход." }, req);

      const url = new URL(req.url, `http://${req.headers.host}`);
      const orderId = url.searchParams.get("orderId");
      if (!orderId) return json(res, 400, { ok: false, message: "Не указан orderId." });

      const orders = await supabaseRequest(`/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&user_id=eq.${encodeURIComponent(user.id)}&select=id,status,provider_payment_id`);
      const order = orders?.[0];
      if (!order) return json(res, 404, { ok: false, message: "Заказ не найден." });

      // После возврата с оплаты дополнительно сверяем состояние в ЮKassa.
      if (order.provider_payment_id && YOOKASSA_SHOP_ID && YOOKASSA_SECRET_KEY && order.status === "pending") {
        const payment = await yookassaRequest(`/payments/${encodeURIComponent(order.provider_payment_id)}`);
        if (payment.status === "succeeded") await markOrderPaid(order.id, payment);
      }

      const refreshed = await supabaseRequest(`/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&user_id=eq.${encodeURIComponent(user.id)}&select=status`);
      return json(res, 200, { ok: true, status: refreshed?.[0]?.status || order.status });
    }

    if (req.method === "POST" && req.url === "/api/yookassa/webhook") {
      const body = await readBody(req);
      const paymentId = body?.object?.id;
      const event = body?.event;

      // Не доверяем webhook payload как источнику истины: при payment.succeeded
      // заново запрашиваем платеж из ЮKassa и проверяем его статус.
      if (event === "payment.succeeded" && paymentId && YOOKASSA_SHOP_ID && YOOKASSA_SECRET_KEY) {
        const payment = await yookassaRequest(`/payments/${encodeURIComponent(paymentId)}`);
        if (payment.status === "succeeded") {
          const orderId = payment.metadata?.order_id;
          if (orderId) await markOrderPaid(orderId, payment);
        }
      }

      return json(res, 200, { ok: true });
    }

    return json(res, 404, { ok: false, message: "Not found" });
  } catch (error) {
    console.error(error);
    return json(res, 500, { ok: false, message: error.message || "Внутренняя ошибка сервера." });
  }
});

server.listen(PORT, () => {
  console.log(`AstroGuide backend listening on http://localhost:${PORT}`);
});
