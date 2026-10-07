import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});

const PORT = Number(process.env.PORT || 8787);

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID || "";
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY || "";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_WEBHOOK_SECRET =
  process.env.TELEGRAM_WEBHOOK_SECRET || "";

const TELEGRAM_STARS_PRICE =
  Number(process.env.TELEGRAM_STARS_PRICE || 299);
const TELEGRAM_AUTH_TTL_SECONDS = 24 * 60 * 60;

const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const ASTROGUIDE_ADMIN_USER_IDS = new Set(
  (process.env.ASTROGUIDE_ADMIN_USER_IDS || "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean)
);

const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://192.168.3.3:5173",
  FRONTEND_ORIGIN,
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
const PREMIUM_PRICE = "299.00";
const RESULT_TYPES = new Set(["tarot", "compatibility", "forecast", "report"]);
const RESULT_ACCESS_TYPES = new Set(["free", "premium", "purchase", "subscription"]);
const SENSITIVE_RESULT_KEYS = /(?:secret|token|password|cookie|authorization|service.?role|api.?key|webhook)/i;

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

function containsSensitiveResultData(value) {
  if (Array.isArray(value)) return value.some(containsSensitiveResultData);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, nested]) => SENSITIVE_RESULT_KEYS.test(key) || containsSensitiveResultData(nested));
}

function getResultIdFromPath(req) {
  const match = req.url.match(/^\/api\/results\/([^/?]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function createReferralCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(crypto.randomBytes(8), byte => alphabet[byte % alphabet.length]).join("");
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

async function safeSupabaseRequest(path, fallback = []) {
  try {
    return await supabaseRequest(path);
  } catch {
    console.warn("Optional admin data unavailable:", path.split("?")[0]);
    return fallback;
  }
}

async function authenticateUser(req) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_NOT_CONFIGURED");
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  if (token.startsWith("tg.")) return authenticateTelegramToken(token);
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${token}`
    }
  });
  if (!response.ok) return null;
  return await response.json();
}

async function requireAdmin(req, res) {
  const user = await authenticateUser(req);
  if (!user) {
    json(res, 401, { ok: false, message: "Необходим вход." }, req);
    return null;
  }
  if (!ASTROGUIDE_ADMIN_USER_IDS.has(user.id)) {
    json(res, 403, { ok: false, message: "Нет доступа." }, req);
    return null;
  }
  return user;
}

function safeAuthUser(user) {
  if (!user) return null;
  return {
    id: user.id || null,
    email: user.email || null,
    created_at: user.created_at || null,
    last_sign_in_at: user.last_sign_in_at || null,
    user_metadata: {
      name: user.user_metadata?.name || null,
      telegram_username: user.user_metadata?.telegram_username || null,
      telegram_user_id: user.user_metadata?.telegram_user_id || null
    }
  };
}

async function listAdminAuthUsers() {
  const users = await supabaseRequest("/auth/v1/admin/users?per_page=1000&page=1");
  return Array.isArray(users) ? users : users?.users || [];
}

async function getAdminAuthUser(userId) {
  try {
    return await supabaseRequest(`/auth/v1/admin/users/${encodeURIComponent(userId)}`);
  } catch {
    return null;
  }
}

function adminDateRange(period) {
  const now = Date.now();
  const days = period === "day" ? 1 : period === "week" ? 7 : 30;
  return new Date(now - days * 86400000).toISOString();
}

function parseAdminListParams(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(10, Number.parseInt(url.searchParams.get("pageSize") || "25", 10) || 25));
  const search = (url.searchParams.get("search") || "").trim().toLowerCase();
  const dateParam = (name, end = false) => {
    const value = url.searchParams.get(name) || "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
    const date = new Date(`${value}T${end ? "23:59:59.999" : "00:00:00.000"}Z`);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  };
  const enumParam = (name, values) => {
    const value = url.searchParams.get(name) || "";
    return values.includes(value) ? value : "";
  };
  return {
    page, pageSize, search,
    registeredFrom: dateParam("registeredFrom"), registeredTo: dateParam("registeredTo", true),
    chartFrom: dateParam("chartFrom"), chartTo: dateParam("chartTo", true),
    birthDate: /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get("birthDate") || "") ? url.searchParams.get("birthDate") : "",
    premium: enumParam("premium", ["true", "false"]),
    hasPurchases: enumParam("hasPurchases", ["true", "false"]),
    hasReferral: enumParam("hasReferral", ["true", "false"])
  };
}

async function getAdminUserSnapshot(userId) {
  const [authUser, profiles, charts, orders, referrals, invitedBy, rewards, ledger, referralCodes, results] = await Promise.all([
    getAdminAuthUser(userId),
    supabaseRequest(`/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,name,telegram_user_id,created_at&limit=1`),
    supabaseRequest(`/rest/v1/charts?user_id=eq.${encodeURIComponent(userId)}&select=id,birth_date,birth_time,city,timezone,latitude,longitude,premium,created_at&order=created_at.desc`),
    supabaseRequest(`/rest/v1/orders?user_id=eq.${encodeURIComponent(userId)}&select=id,amount_rub,status,provider,provider_payment_id,chart_id,created_at,paid_at&order=created_at.desc`),
    safeSupabaseRequest(`/rest/v1/referrals?referrer_user_id=eq.${encodeURIComponent(userId)}&select=id,referred_user_id,referral_code,status,created_at,activated_at,qualified_at,rewarded_at&order=created_at.desc`),
    safeSupabaseRequest(`/rest/v1/referrals?referred_user_id=eq.${encodeURIComponent(userId)}&select=id,referrer_user_id,referral_code,status,created_at,activated_at,qualified_at,rewarded_at&limit=1`),
    safeSupabaseRequest(`/rest/v1/referral_rewards?user_id=eq.${encodeURIComponent(userId)}&select=id,referral_id,reward_type,status,created_at,used_at,expires_at&order=created_at.desc`),
    safeSupabaseRequest(`/rest/v1/free_analysis_ledger?user_id=eq.${encodeURIComponent(userId)}&select=id,amount,source,reference_id,idempotency_key,created_at&order=created_at.desc`),
    safeSupabaseRequest(`/rest/v1/referral_codes?user_id=eq.${encodeURIComponent(userId)}&is_active=eq.true&select=code&limit=1`),
    safeSupabaseRequest(`/rest/v1/user_results?user_id=eq.${encodeURIComponent(userId)}&select=id,result_type,title,created_at,access_type,source_data,result_data,metadata&order=created_at.desc`)
  ]);
  const profile = profiles?.[0] || null;
  const balance = (ledger || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return {
    profile,
    auth: safeAuthUser(authUser),
    charts: charts || [],
    orders: orders || [],
    referrals: referrals || [],
    invitedBy: invitedBy?.[0] || null,
    referralCode: referralCodes?.[0]?.code || null,
    referralLink: referralCodes?.[0]?.code ? `${FRONTEND_ORIGIN.replace(/\/$/, "")}/?ref=${encodeURIComponent(referralCodes[0].code)}` : null,
    rewards: rewards || [],
    results: results || [],
    freeAnalysis: {
      granted: (ledger || []).filter(item => Number(item.amount) > 0).reduce((sum, item) => sum + Number(item.amount), 0),
      used: Math.abs((ledger || []).filter(item => Number(item.amount) < 0).reduce((sum, item) => sum + Number(item.amount), 0)),
      balance: Math.max(0, balance),
      ledger: ledger || []
    }
  };
}

function verifyTelegramInitData(initData) {
  if (!TELEGRAM_BOT_TOKEN || typeof initData !== "string" || !initData) return null;
  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  const authDate = Number(params.get("auth_date"));
  if (!receivedHash || !Number.isInteger(authDate)) return null;
  if (Math.abs(Math.floor(Date.now() / 1000) - authDate) > TELEGRAM_AUTH_TTL_SECONDS) return null;
  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(TELEGRAM_BOT_TOKEN).digest();
  const expectedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  const received = Buffer.from(receivedHash, "hex");
  const expected = Buffer.from(expectedHash, "hex");
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return null;
  try {
    const user = JSON.parse(params.get("user") || "null");
    return user?.id ? user : null;
  } catch {
    return null;
  }
}

function createTelegramToken(user) {
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    telegram_user_id: user.telegram_user_id,
    exp: Math.floor(Date.now() / 1000) + TELEGRAM_AUTH_TTL_SECONDS
  })).toString("base64url");
  const signature = crypto.createHmac("sha256", TELEGRAM_BOT_TOKEN).update(payload).digest("base64url");
  return `tg.${payload}.${signature}`;
}

function authenticateTelegramToken(token) {
  if (!TELEGRAM_BOT_TOKEN) return null;
  const [, payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = crypto.createHmac("sha256", TELEGRAM_BOT_TOKEN).update(payload).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.sub || data.exp < Math.floor(Date.now() / 1000)) return null;
    return { id: data.sub, user_metadata: { telegram_user_id: data.telegram_user_id } };
  } catch {
    return null;
  }
}

async function getOrCreateTelegramUser(telegramUser) {
  const existing = await supabaseRequest(
    `/rest/v1/profiles?telegram_user_id=eq.${encodeURIComponent(telegramUser.id)}&select=id&limit=1`
  );
  if (existing?.[0]?.id) return { id: existing[0].id, telegram_user_id: telegramUser.id };

  const email = `telegram_${telegramUser.id}@users.astroguide.invalid`;
  let created;
  try {
    created = await supabaseRequest("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email,
        password: crypto.randomBytes(32).toString("hex"),
        email_confirm: true,
        user_metadata: { telegram_user_id: telegramUser.id, telegram_username: telegramUser.username || null }
      })
    });
  } catch (error) {
    if (!String(error.message).toLowerCase().includes("already")) throw error;
    const users = await supabaseRequest("/auth/v1/admin/users?per_page=1000");
    created = users?.users?.find((user) => user.email === email);
  }
  if (!created?.id) throw new Error("Не удалось создать Telegram-пользователя.");
  await supabaseRequest("/rest/v1/profiles", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      id: created.id,
      telegram_user_id: telegramUser.id,
      name: [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(" ")
    })
  });
  return { id: created.id, telegram_user_id: telegramUser.id };
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

async function telegramRequest(method, body = {}) {
  if (!TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_NOT_CONFIGURED");

  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    throw new Error(
      data?.description || `Telegram API HTTP ${response.status}`
    );
  }

  return data.result;
}

function isTelegramWebhookAuthorized(req) {
  if (!TELEGRAM_WEBHOOK_SECRET) return true;
  return req.headers["x-telegram-bot-api-secret-token"] === TELEGRAM_WEBHOOK_SECRET;
}

function getTelegramPayloadOrderId(payload) {
  if (typeof payload !== "string") return null;
  const match = payload.match(/^astroguide:([A-Za-z0-9_-]+)$/);
  return match?.[1] || null;
}

async function getTelegramUserIdForAstroUser(userId) {
  const rows = await supabaseRequest(
    `/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=telegram_user_id&limit=1`
  );
  return rows?.[0]?.telegram_user_id == null ? null : String(rows[0].telegram_user_id);
}

async function telegramOrderBelongsToUser(order, telegramUserId) {
  if (!order?.user_id || telegramUserId == null) return false;
  const ownerTelegramUserId = await getTelegramUserIdForAstroUser(order.user_id);
  return ownerTelegramUserId === String(telegramUserId);
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

async function getOrCreateReferralCode(userId) {
  const existing = await supabaseRequest(
    `/rest/v1/referral_codes?user_id=eq.${encodeURIComponent(userId)}&is_active=eq.true&select=code&limit=1`
  );
  if (existing?.[0]?.code) return existing[0].code;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const rows = await supabaseRequest("/rest/v1/referral_codes", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ user_id: userId, code: createReferralCode() })
      });
      if (rows?.[0]?.code) return rows[0].code;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
  throw new Error("Не удалось создать реферальный код.");
}

async function qualifyReferralForUser(userId) {
  const referrals = await supabaseRequest(
    `/rest/v1/referrals?referred_user_id=eq.${encodeURIComponent(userId)}&status=in.(pending,qualified)&select=id,referrer_user_id,status&order=created_at.asc&limit=1`
  );
  const referral = referrals?.[0];
  if (!referral || referral.status === "rewarded") return false;

  const now = new Date().toISOString();
  if (referral.status === "pending") {
    await supabaseRequest(`/rest/v1/referrals?id=eq.${encodeURIComponent(referral.id)}&status=eq.pending`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ status: "qualified", qualified_at: now })
    });
  }

  try {
    await supabaseRequest("/rest/v1/referral_rewards", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        user_id: referral.referrer_user_id,
        referral_id: referral.id,
        reward_type: "free_analysis"
      })
    });
  } catch (error) {
    if (!String(error.message).toLowerCase().includes("duplicate")) throw error;
  }

  try {
    await supabaseRequest("/rest/v1/free_analysis_ledger", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        user_id: referral.referrer_user_id,
        amount: 1,
        source: "referral_reward",
        reference_id: referral.id,
        idempotency_key: `referral_reward:${referral.id}`
      })
    });
  } catch (error) {
    if (!String(error.message).toLowerCase().includes("duplicate")) throw error;
  }

  await supabaseRequest(`/rest/v1/referrals?id=eq.${encodeURIComponent(referral.id)}&status=eq.qualified`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ status: "rewarded", rewarded_at: now })
  });
  return true;
}

async function ensureInitialFreeAnalysis(userId) {
  const existing = await supabaseRequest(
    `/rest/v1/free_analysis_ledger?user_id=eq.${encodeURIComponent(userId)}&source=eq.initial&select=id&limit=1`
  );
  if (existing?.[0]) return false;

  try {
    await supabaseRequest("/rest/v1/free_analysis_ledger", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        user_id: userId,
        amount: 1,
        source: "initial",
        idempotency_key: `initial:${userId}`
      })
    });
    return true;
  } catch (error) {
    if (String(error.message).toLowerCase().includes("duplicate")) return false;
    throw error;
  }
}

async function getFreeAnalysisSummary(userId) {
  await ensureInitialFreeAnalysis(userId);
  const ledger = await supabaseRequest(
    `/rest/v1/free_analysis_ledger?user_id=eq.${encodeURIComponent(userId)}&select=id,amount,source,reference_id,created_at&order=created_at.asc`
  );
  const granted = (ledger || []).filter(item => Number(item.amount) > 0)
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const used = Math.abs((ledger || []).filter(item => Number(item.amount) < 0)
    .reduce((sum, item) => sum + Number(item.amount), 0));
  return { granted, used, balance: Math.max(0, granted - used), ledger: ledger || [] };
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
    if (req.method === "POST" && req.url === "/api/telegram-auth") {
      const body = await readBody(req);
      const telegramUser = verifyTelegramInitData(body?.initData);
      if (!telegramUser) return json(res, 401, { ok: false, message: "Недействительные данные Telegram." }, req);
      const user = await getOrCreateTelegramUser(telegramUser);
      return json(res, 200, {
        ok: true,
        access_token: createTelegramToken(user),
        user: { id: user.id, telegram_user_id: user.telegram_user_id }
      }, req);
    }

    if (req.method === "GET" && req.url === "/api/payment-config") {
      return json(res, 200, {
        ok: true,
        configured: Boolean(YOOKASSA_SHOP_ID && YOOKASSA_SECRET_KEY),
        starsConfigured: Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_STARS_PRICE > 0),
        amountRub: 299,
        starsPrice: TELEGRAM_STARS_PRICE,
        providers: {
          sbp: Boolean(YOOKASSA_SHOP_ID && YOOKASSA_SECRET_KEY),
          telegramStars: Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_STARS_PRICE > 0)
        }
      });
    }

    if (req.method === "GET" && (req.url === "/api/health" || req.url === "/health")) {
      return json(res, 200, {
        ok: true,
        supabaseConfigured: Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY),
        yookassaConfigured: Boolean(YOOKASSA_SHOP_ID && YOOKASSA_SECRET_KEY),
        telegramConfigured: Boolean(TELEGRAM_BOT_TOKEN),
        telegramStarsPrice: TELEGRAM_STARS_PRICE,
        port: PORT
      });
    }

    if (req.method === "GET" && req.url.startsWith("/api/admin/")) {
      const admin = await requireAdmin(req, res);
      if (!admin) return;
      const pathOnly = new URL(req.url, `http://${req.headers.host}`).pathname;

      if (pathOnly === "/api/admin/stats") {
        const [users, charts, orders, referrals, rewards, ledger] = await Promise.all([
          listAdminAuthUsers(),
          supabaseRequest("/rest/v1/charts?select=id,user_id,premium,created_at"),
          supabaseRequest("/rest/v1/orders?select=id,user_id,amount_rub,status,provider,chart_id,created_at,paid_at"),
          safeSupabaseRequest("/rest/v1/referrals?select=id,status,created_at"),
          safeSupabaseRequest("/rest/v1/referral_rewards?select=id,status,created_at"),
          safeSupabaseRequest("/rest/v1/free_analysis_ledger?select=id,amount,source,created_at")
        ]);
        const paidOrders = (orders || []).filter(order => order.status === "paid");
        const granted = (ledger || []).filter(item => Number(item.amount) > 0).reduce((sum, item) => sum + Number(item.amount), 0);
        const used = Math.abs((ledger || []).filter(item => Number(item.amount) < 0).reduce((sum, item) => sum + Number(item.amount), 0));
        return json(res, 200, { ok: true, stats: {
          users: users.length, usersToday: users.filter(item => item.created_at >= adminDateRange("day")).length,
          usersThisWeek: users.filter(item => item.created_at >= adminDateRange("week")).length,
          usersThisMonth: users.filter(item => item.created_at >= adminDateRange("month")).length,
          charts: charts?.length || 0, premiumCharts: charts?.filter(item => item.premium).length || 0,
          orders: orders?.length || 0, paidOrders: paidOrders.length,
          revenue: paidOrders.reduce((sum, order) => sum + Number(order.amount_rub || 0), 0),
          referrals: referrals?.length || 0,
          qualifiedReferrals: referrals?.filter(item => ["qualified", "rewarded"].includes(item.status)).length || 0,
          referralRewards: rewards?.length || 0, freeAnalysisGranted: granted, freeAnalysisUsed: used,
          freeAnalysisOutstanding: Math.max(0, granted - used)
        } }, req);
      }

      if (pathOnly === "/api/admin/users") {
        const { page, pageSize, search, premium } = parseAdminListParams(req);
        const [users, profiles, charts, orders, referrals, ledger] = await Promise.all([
          listAdminAuthUsers(),
          supabaseRequest("/rest/v1/profiles?select=id,name,telegram_user_id,created_at"),
          supabaseRequest("/rest/v1/charts?select=id,user_id,premium,created_at,birth_date"),
          supabaseRequest("/rest/v1/orders?select=id,user_id,status"),
          safeSupabaseRequest("/rest/v1/referrals?select=referred_user_id"),
          safeSupabaseRequest("/rest/v1/free_analysis_ledger?select=user_id,amount")
        ]);
        const profileMap = new Map((profiles || []).map(item => [item.id, item]));
        const referredIds = new Set((referrals || []).map(item => item.referred_user_id));
        const { registeredFrom, registeredTo, chartFrom, chartTo, birthDate, hasPurchases, hasReferral } = parseAdminListParams(req);
        const rows = users.map(authUser => {
          const profile = profileMap.get(authUser.id) || {};
          const userCharts = (charts || []).filter(item => item.user_id === authUser.id);
          const createdAt = authUser.created_at || profile.created_at || null;
          const dateCharts = userCharts.filter(item => (!chartFrom || item.created_at >= chartFrom) && (!chartTo || item.created_at <= chartTo) && (!birthDate || item.birth_date === birthDate));
          const balance = (ledger || []).filter(item => item.user_id === authUser.id).reduce((sum, item) => sum + Number(item.amount || 0), 0);
          const purchases = (orders || []).filter(item => item.user_id === authUser.id && item.status === "paid").length;
          const premiumValue = userCharts.some(item => item.premium);
          return { id: authUser.id, email: authUser.email || null, created_at: createdAt, name: profile.name || authUser.user_metadata?.name || null, telegram_user_id: profile.telegram_user_id || authUser.user_metadata?.telegram_user_id || null, charts: dateCharts.length, premium: premiumValue, free_analysis: Math.max(0, balance), purchases };
        }).filter(item => {
          const haystack = [item.id, item.email, item.name, item.telegram_user_id].filter(Boolean).join(" ").toLowerCase();
          const registered = item.created_at;
          const userId = item.id;
          const referralMatch = referredIds.has(userId);
          const purchaseMatch = item.purchases > 0;
          return (!search || haystack.includes(search)) && (!premium || String(item.premium) === premium) && (!registeredFrom || (registered && registered >= registeredFrom)) && (!registeredTo || (registered && registered <= registeredTo)) && (!birthDate || dateCharts.length > 0) && (!hasPurchases || String(purchaseMatch) === hasPurchases) && (!hasReferral || String(referralMatch) === hasReferral);
        });
        const start = (page - 1) * pageSize;
        return json(res, 200, { ok: true, users: rows.slice(start, start + pageSize), page, pageSize, total: rows.length }, req);
      }

      if (pathOnly === "/api/admin/payments") {
        const { page, pageSize } = parseAdminListParams(req);
        const orders = await supabaseRequest("/rest/v1/orders?select=id,user_id,amount_rub,status,provider,chart_id,created_at,paid_at&order=created_at.desc");
        const start = (page - 1) * pageSize;
        return json(res, 200, { ok: true, payments: (orders || []).slice(start, start + pageSize), page, pageSize, total: orders?.length || 0 }, req);
      }

      if (pathOnly === "/api/admin/referrals") {
        const { page, pageSize } = parseAdminListParams(req);
        const referrals = await supabaseRequest("/rest/v1/referrals?select=id,referrer_user_id,referred_user_id,referral_code,status,created_at,qualified_at,rewarded_at&order=created_at.desc");
        const start = (page - 1) * pageSize;
        return json(res, 200, { ok: true, referrals: (referrals || []).slice(start, start + pageSize), page, pageSize, total: referrals?.length || 0 }, req);
      }

      const userMatch = pathOnly.match(/^\/api\/admin\/users\/([^/]+)(?:\/(charts|orders|referrals|free-analysis))?$/);
      if (userMatch) {
        const userId = decodeURIComponent(userMatch[1]);
        const subresource = userMatch[2];
        if (subresource === "charts") return json(res, 200, { ok: true, charts: await supabaseRequest(`/rest/v1/charts?user_id=eq.${encodeURIComponent(userId)}&select=id,birth_date,birth_time,city,timezone,latitude,longitude,premium,created_at&order=created_at.desc`) }, req);
        if (subresource === "orders") return json(res, 200, { ok: true, orders: await supabaseRequest(`/rest/v1/orders?user_id=eq.${encodeURIComponent(userId)}&select=id,amount_rub,status,provider,provider_payment_id,chart_id,created_at,paid_at&order=created_at.desc`) }, req);
        if (subresource === "referrals") return json(res, 200, { ok: true, referrals: await safeSupabaseRequest(`/rest/v1/referrals?or=(referrer_user_id.eq.${encodeURIComponent(userId)},referred_user_id.eq.${encodeURIComponent(userId)})&select=id,referrer_user_id,referred_user_id,referral_code,status,created_at,activated_at,qualified_at,rewarded_at&order=created_at.desc`), rewards: await safeSupabaseRequest(`/rest/v1/referral_rewards?user_id=eq.${encodeURIComponent(userId)}&select=id,referral_id,reward_type,status,created_at,used_at,expires_at&order=created_at.desc`) }, req);
        if (subresource === "free-analysis") {
          const ledger = await safeSupabaseRequest(`/rest/v1/free_analysis_ledger?user_id=eq.${encodeURIComponent(userId)}&select=id,amount,source,reference_id,created_at&order=created_at.desc`);
          const granted = ledger.filter(item => Number(item.amount) > 0).reduce((sum, item) => sum + Number(item.amount), 0);
          const used = Math.abs(ledger.filter(item => Number(item.amount) < 0).reduce((sum, item) => sum + Number(item.amount), 0));
          return json(res, 200, { ok: true, granted, used, balance: Math.max(0, granted - used), ledger }, req);
        }
        const snapshot = await getAdminUserSnapshot(userId);
        if (!snapshot.auth && !snapshot.profile) return json(res, 404, { ok: false, message: "Пользователь не найден." }, req);
        return json(res, 200, { ok: true, user: snapshot, charts: snapshot.charts, orders: snapshot.orders, referrals: snapshot.referrals, freeAnalysis: snapshot.freeAnalysis, results: snapshot.results }, req);
      }
      return json(res, 404, { ok: false, message: "Admin endpoint не найден." }, req);
    }

    if (req.method === "GET" && (req.url === "/api/results" || req.url.startsWith("/api/results?"))) {
      const user = await authenticateUser(req);
      if (!user) return json(res, 401, { ok: false, message: "Необходим вход." }, req);
      const url = new URL(req.url, `http://${req.headers.host}`);
      const resultType = url.searchParams.get("result_type");
      if (resultType && !RESULT_TYPES.has(resultType)) {
        return json(res, 400, { ok: false, message: "Недопустимый тип результата." }, req);
      }
      const filters = [
        `user_id=eq.${encodeURIComponent(user.id)}`,
        "select=id,user_id,result_type,title,created_at,access_type,source_data,result_data,metadata",
        "order=created_at.desc"
      ];
      if (resultType) filters.push(`result_type=eq.${encodeURIComponent(resultType)}`);
      const rows = await supabaseRequest(`/rest/v1/user_results?${filters.join("&")}`);
      return json(res, 200, { ok: true, results: rows || [] }, req);
    }

    if (req.method === "GET" && req.url === "/api/referral") {
      const user = await authenticateUser(req);
      if (!user) return json(res, 401, { ok: false, message: "Необходим вход." }, req);
      const code = await getOrCreateReferralCode(user.id);
      const referrals = await supabaseRequest(
        `/rest/v1/referrals?referrer_user_id=eq.${encodeURIComponent(user.id)}&select=id,status`
      );
      const rewards = await supabaseRequest(
        `/rest/v1/referral_rewards?user_id=eq.${encodeURIComponent(user.id)}&select=id,status`
      );
      return json(res, 200, {
        ok: true,
        code,
        link: `${FRONTEND_ORIGIN.replace(/\/$/, "")}/?ref=${encodeURIComponent(code)}`,
        invitedCount: referrals?.length || 0,
        qualifiedCount: referrals?.filter(item => item.status === "qualified" || item.status === "rewarded").length || 0,
        rewardsCount: rewards?.filter(item => item.status === "available").length || 0
      }, req);
    }

    if (req.method === "GET" && req.url === "/api/free-analysis") {
      const user = await authenticateUser(req);
      if (!user) return json(res, 401, { ok: false, message: "Необходим вход." }, req);
      const summary = await getFreeAnalysisSummary(user.id);
      return json(res, 200, { ok: true, ...summary }, req);
    }

    if (req.method === "POST" && req.url === "/api/free-analysis/consume") {
      const user = await authenticateUser(req);
      if (!user) return json(res, 401, { ok: false, message: "Необходим вход." }, req);
      const body = await readBody(req);
      const chartId = typeof body?.chartId === "string" ? body.chartId.trim() : "";
      if (!chartId) return json(res, 400, { ok: false, message: "Не указана карта." }, req);

      const charts = await supabaseRequest(
        `/rest/v1/charts?id=eq.${encodeURIComponent(chartId)}&user_id=eq.${encodeURIComponent(user.id)}&select=id,premium&limit=1`
      );
      if (!charts?.[0]) return json(res, 404, { ok: false, message: "Карта не найдена." }, req);
      if (charts[0].premium) {
        return json(res, 200, { ok: true, consumed: false, premium: true }, req);
      }

      await ensureInitialFreeAnalysis(user.id);
      const idempotencyKey = `analysis:chart:${chartId}:${user.id}`;
      const consumed = await supabaseRequest("/rest/v1/rpc/consume_free_analysis", {
        method: "POST",
        body: JSON.stringify({ p_user_id: user.id, p_idempotency_key: idempotencyKey })
      });
      if (consumed !== true) {
        return json(res, 409, {
          ok: false,
          consumed: false,
          message: "Бесплатные разборы закончились."
        }, req);
      }

      const referralQualified = await qualifyReferralForUser(user.id);
      const summary = await getFreeAnalysisSummary(user.id);
      return json(res, 200, { ok: true, consumed: true, referralQualified, ...summary }, req);
    }

    if (req.method === "POST" && req.url === "/api/referral/attach") {
      const user = await authenticateUser(req);
      if (!user) return json(res, 401, { ok: false, message: "Необходим вход." }, req);
      const body = await readBody(req);
      const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
      if (!/^[A-Z2-9]{8}$/.test(code)) return json(res, 400, { ok: false, message: "Недействительная реферальная ссылка." }, req);

      const existing = await supabaseRequest(
        `/rest/v1/referrals?referred_user_id=eq.${encodeURIComponent(user.id)}&select=id,status&limit=1`
      );
      if (existing?.[0]) return json(res, 200, { ok: true, attached: true, status: existing[0].status }, req);

      const codes = await supabaseRequest(
        `/rest/v1/referral_codes?code=eq.${encodeURIComponent(code)}&is_active=eq.true&select=user_id&limit=1`
      );
      const referrerUserId = codes?.[0]?.user_id;
      if (!referrerUserId || referrerUserId === user.id) {
        return json(res, 400, { ok: false, message: "Реферальный код недействителен." }, req);
      }

      try {
        await supabaseRequest("/rest/v1/referrals", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ referrer_user_id: referrerUserId, referred_user_id: user.id, referral_code: code })
        });
      } catch (error) {
        if (!String(error.message).toLowerCase().includes("duplicate")) throw error;
      }
      return json(res, 200, { ok: true, attached: true, status: "pending" }, req);
    }

    if (req.method === "GET" && getResultIdFromPath(req)) {
      const user = await authenticateUser(req);
      if (!user) return json(res, 401, { ok: false, message: "Необходим вход." }, req);
      const id = getResultIdFromPath(req);
      const rows = await supabaseRequest(
        `/rest/v1/user_results?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}&select=id,user_id,result_type,title,created_at,access_type,source_data,result_data,metadata&limit=1`
      );
      if (!rows?.[0]) return json(res, 404, { ok: false, message: "Результат не найден." }, req);
      return json(res, 200, { ok: true, result: rows[0] }, req);
    }

    if (req.method === "POST" && req.url === "/api/results") {
      const user = await authenticateUser(req);
      if (!user) return json(res, 401, { ok: false, message: "Необходим вход." }, req);
      const body = await readBody(req);
      const title = typeof body?.title === "string" ? body.title.trim() : "";
      const resultType = body?.result_type;
      const accessType = body?.access_type || "free";
      const sourceData = body?.source_data ?? {};
      const resultData = body?.result_data ?? {};
      const metadata = body?.metadata ?? {};
      if (title.length < 1 || title.length > 200) {
        return json(res, 400, { ok: false, message: "Название должно содержать от 1 до 200 символов." }, req);
      }
      if (!RESULT_TYPES.has(resultType)) {
        return json(res, 400, { ok: false, message: "Недопустимый тип результата." }, req);
      }
      if (!RESULT_ACCESS_TYPES.has(accessType)) {
        return json(res, 400, { ok: false, message: "Недопустимый тип доступа." }, req);
      }
      for (const [name, value] of [["source_data", sourceData], ["result_data", resultData], ["metadata", metadata]]) {
        if (value === null || typeof value !== "object" || containsSensitiveResultData(value)) {
          return json(res, 400, { ok: false, message: `Недопустимое содержимое поля ${name}.` }, req);
        }
      }
      const rows = await supabaseRequest("/rest/v1/user_results", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          user_id: user.id,
          result_type: resultType,
          title,
          access_type: accessType,
          source_data: sourceData,
          result_data: resultData,
          metadata
        })
      });
      return json(res, 201, { ok: true, result: rows?.[0] || null }, req);
    }

    if (req.method === "DELETE" && getResultIdFromPath(req)) {
      const user = await authenticateUser(req);
      if (!user) return json(res, 401, { ok: false, message: "Необходим вход." }, req);
      const id = getResultIdFromPath(req);
      const rows = await supabaseRequest(
        `/rest/v1/user_results?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}&select=id&limit=1`
      );
      if (!rows?.[0]) return json(res, 404, { ok: false, message: "Результат не найден." }, req);
      await supabaseRequest(
        `/rest/v1/user_results?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}`,
        { method: "DELETE" }
      );
      return json(res, 200, { ok: true }, req);
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
          premium: false
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
      const paymentMethod = body.paymentMethod || body.method || "sbp";
      if (!["sbp", "yookassa"].includes(paymentMethod)) {
        return json(res, 400, { ok: false, message: "Неподдерживаемый способ оплаты." }, req);
      }
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
          amount_rub: 299,
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
            payment_method_data: paymentMethod === "sbp" ? { type: "sbp" } : undefined,
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

    if (req.method === "POST" && req.url === "/api/create-stars-payment") {
      if (!TELEGRAM_BOT_TOKEN || !Number.isInteger(TELEGRAM_STARS_PRICE) || TELEGRAM_STARS_PRICE <= 0) {
        return json(res, 503, {
          ok: false,
          code: "STARS_NOT_CONFIGURED",
          message: "Telegram Stars ещё не настроены. Добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_STARS_PRICE в server/.env."
        }, req);
      }

      const user = await authenticateUser(req);
      if (!user) {
        return json(res, 401, {
          ok: false,
          message: "Войдите в аккаунт перед покупкой Premium."
        }, req);
      }

      const body = await readBody(req);
      const chart = body?.chart;

      if (!chart?.date || !chart?.time || !chart?.city) {
        return json(res, 400, {
          ok: false,
          message: "Не переданы данные текущей натальной карты."
        }, req);
      }

      const chartRow = await createOrFindChart(user.id, chart);
      if (!chartRow) {
        return json(res, 500, {
          ok: false,
          message: "Не удалось сохранить карту перед оплатой."
        }, req);
      }

      if (chartRow.premium) {
        return json(res, 200, {
          ok: true,
          alreadyPremium: true
        }, req);
      }

      const pendingOrders = await supabaseRequest(
        `/rest/v1/orders?user_id=eq.${encodeURIComponent(user.id)}&chart_id=eq.${encodeURIComponent(chartRow.id)}&provider=eq.telegram_stars&status=eq.pending&select=id,provider_payment_id&order=created_at.desc&limit=1`
      );
      let order = pendingOrders?.[0];

      if (!order) {
        const orderRows = await supabaseRequest("/rest/v1/orders", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            user_id: user.id,
            amount_rub: 299,
            status: "pending",
            provider: "telegram_stars",
            chart_id: chartRow.id,
            chart_date: chart.date,
            chart_time: chart.time,
            chart_city: chart.city
          })
        });
        order = orderRows?.[0];
      }
      if (!order) throw new Error("Не удалось создать заказ.");

      const payload = `astroguide:${order.id}`;

      try {
        const invoiceLink = await telegramRequest("createInvoiceLink", {
          title: "AstroGuide Premium",
          description: "Полный персональный разбор натальной карты",
          payload,
          provider_token: "",
          currency: "XTR",
          prices: [
            {
              label: "AstroGuide Premium",
              amount: TELEGRAM_STARS_PRICE
            }
          ]
        });

        await supabaseRequest(
          `/rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`,
          {
            method: "PATCH",
            headers: { Prefer: "return=minimal" },
            body: JSON.stringify({
              provider_payment_id: `invoice:${order.id}`
            })
          }
        );

        return json(res, 200, {
          ok: true,
          orderId: order.id,
          provider: "telegram_stars",
          stars: TELEGRAM_STARS_PRICE,
          invoiceUrl: invoiceLink
        }, req);
      } catch (error) {
        await supabaseRequest(
          `/rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`,
          {
            method: "PATCH",
            headers: { Prefer: "return=minimal" },
            body: JSON.stringify({ status: "cancelled" })
          }
        ).catch(() => {});

        throw error;
      }
    }

    if (req.method === "GET" && req.url.startsWith("/api/payment-status")) {
      const user = await authenticateUser(req);
      if (!user) return json(res, 401, { ok: false, message: "Необходим вход." }, req);

      const url = new URL(req.url, `http://${req.headers.host}`);
      const orderId = url.searchParams.get("orderId");
      if (!orderId) return json(res, 400, { ok: false, message: "Не указан orderId." });

      const orders = await supabaseRequest(
        `/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&user_id=eq.${encodeURIComponent(user.id)}&select=id,status,provider,provider_payment_id`
      );
      const order = orders?.[0];
      if (!order) return json(res, 404, { ok: false, message: "Заказ не найден." });

      // Для ЮKassa дополнительно сверяем состояние платежа после возврата.
      if (
        order.provider !== "telegram_stars" &&
        order.provider_payment_id &&
        YOOKASSA_SHOP_ID &&
        YOOKASSA_SECRET_KEY &&
        order.status === "pending"
      ) {
        const payment = await yookassaRequest(
          `/payments/${encodeURIComponent(order.provider_payment_id)}`
        );
        if (payment.status === "succeeded") {
          await markOrderPaid(order.id, payment);
        }
      }

      const refreshed = await supabaseRequest(
        `/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&user_id=eq.${encodeURIComponent(user.id)}&select=status,provider`
      );

      return json(res, 200, {
        ok: true,
        status: refreshed?.[0]?.status || order.status,
        provider: refreshed?.[0]?.provider || order.provider
      }, req);
    }

    if (req.method === "POST" && req.url === "/api/telegram/webhook") {
      if (!isTelegramWebhookAuthorized(req)) {
        return json(res, 401, { ok: false, message: "Unauthorized" }, req);
      }

      const update = await readBody(req);

      // Telegram требует ответить на pre_checkout_query не позднее 10 секунд.
      if (update?.pre_checkout_query) {
        const query = update.pre_checkout_query;
        const payload = query.invoice_payload;
        const orderId = getTelegramPayloadOrderId(payload);

        let approved = false;
        let errorMessage = "Заказ недоступен.";

        if (orderId) {
          const rows = await supabaseRequest(
            `/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&select=id,status,provider,user_id,amount_rub,chart_id&limit=1`
          );
          const order = rows?.[0];

          approved =
            Boolean(order) &&
            order.status === "pending" &&
            order.provider === "telegram_stars" &&
            Number(query.total_amount) === TELEGRAM_STARS_PRICE &&
            query.currency === "XTR" &&
            await telegramOrderBelongsToUser(order, query.from?.id);

          if (!approved) {
            errorMessage = "Не удалось подтвердить заказ. Создайте новый платёж.";
          }
        }

        await telegramRequest("answerPreCheckoutQuery", {
          pre_checkout_query_id: query.id,
          ok: approved,
          ...(approved ? {} : { error_message: errorMessage })
        });

        return json(res, 200, { ok: true });
      }

      const successfulPayment = update?.message?.successful_payment;
      if (successfulPayment) {
        const payload = successfulPayment.invoice_payload;
        const orderId = getTelegramPayloadOrderId(payload);

        if (!orderId) {
          return json(res, 200, { ok: true });
        }

        if (
          successfulPayment.currency !== "XTR" ||
          Number(successfulPayment.total_amount) !== TELEGRAM_STARS_PRICE
        ) {
          console.error("Telegram Stars payment amount mismatch", {
            orderId,
            currency: successfulPayment.currency,
            totalAmount: successfulPayment.total_amount
          });
          return json(res, 200, { ok: true });
        }

        const rows = await supabaseRequest(
          `/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&select=id,status,provider,user_id,chart_id&limit=1`
        );
        const order = rows?.[0];

        if (
          !order ||
          order.provider !== "telegram_stars" ||
          !(await telegramOrderBelongsToUser(order, update.message?.from?.id))
        ) {
          return json(res, 200, { ok: true });
        }

        const paymentRecord = {
          id: successfulPayment.telegram_payment_charge_id,
          currency: successfulPayment.currency,
          total_amount: successfulPayment.total_amount,
          telegram_payment_charge_id: successfulPayment.telegram_payment_charge_id,
          provider_payment_charge_id: successfulPayment.provider_payment_charge_id
        };

        await markOrderPaid(order.id, paymentRecord);
      }

      return json(res, 200, { ok: true });
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
