const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const ACCESS_KEY = "astroguide_access_token";
const REFRESH_KEY = "astroguide_refresh_token";
const USER_KEY = "astroguide_user";
const SERVER_URL = import.meta.env.VITE_ASTROGUIDE_SERVER_URL || "";

export const cloudConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let refreshPromise = null;

function headers(accessToken) {
  return {
    apikey: SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
  };
}

function saveSession(data) {
  if (data?.access_token) localStorage.setItem(ACCESS_KEY, data.access_token);
  if (data?.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
  if (data?.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

function clearCloudSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("astroguide:auth"));
}

function tokenExpiresSoon(token, marginSeconds = 90) {
  if (!token) return true;
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized.padEnd(normalized.length + (4 - normalized.length % 4) % 4, "=")));
    return !decoded.exp || decoded.exp <= Math.floor(Date.now() / 1000) + marginSeconds;
  } catch {
    return true;
  }
}

async function refreshSession() {
  if (!cloudConfigured) return null;
  if (refreshPromise) return refreshPromise;

  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.access_token) {
        clearCloudSession();
        return null;
      }
      saveSession(data);
      window.dispatchEvent(new Event("astroguide:auth"));
      return getSession();
    } catch (error) {
      console.error("Не удалось обновить сессию Supabase:", error);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function getValidSession() {
  const session = getSession();
  if (!cloudConfigured || !session?.refresh_token) return session;
  if (!tokenExpiresSoon(session.access_token)) return session;
  return (await refreshSession()) || null;
}

async function ensureProfile(user, accessToken) {
  if (!user?.id || !accessToken || !cloudConfigured) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        ...headers(accessToken),
        Prefer: "resolution=ignore-duplicates,return=minimal"
      },
      body: JSON.stringify({
        id: user.id,
        name: user.user_metadata?.name || ""
      })
    });
  } catch (error) {
    console.warn("Профиль Supabase не создан автоматически:", error);
  }
}

export function getSession() {
  if (!cloudConfigured) {
    try {
      const account = JSON.parse(localStorage.getItem("astroguide_account") || "null");
      return account?.signedIn ? { user: account, access_token: null } : null;
    } catch {
      return null;
    }
  }
  const access_token = localStorage.getItem(ACCESS_KEY);
  const refresh_token = localStorage.getItem(REFRESH_KEY);
  try {
    const user = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    return access_token && user ? { access_token, refresh_token, user } : null;
  } catch {
    return null;
  }
}

export async function signUp({ email, password, name }) {
  if (!cloudConfigured) {
    const account = { email, name, signedIn: true, localOnly: true };
    localStorage.setItem("astroguide_account", JSON.stringify(account));
    return { user: account, session: null, localOnly: true };
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email, password, data: { name } })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.msg || data.error_description || data.message || "Не удалось создать аккаунт.");
  saveSession(data);
  await ensureProfile(data.user, data.access_token);
  return { user: data.user, session: data, localOnly: false };
}

export async function signIn({ email, password }) {
  if (!cloudConfigured) {
    const account = { email, name: "", signedIn: true, localOnly: true };
    localStorage.setItem("astroguide_account", JSON.stringify(account));
    return { user: account, session: null, localOnly: true };
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.msg || data.message || "Неверный email или пароль.");
  saveSession(data);
  await ensureProfile(data.user, data.access_token);
  window.dispatchEvent(new Event("astroguide:auth"));
  return { user: data.user, session: data, localOnly: false };
}

export function signOut() {
  clearCloudSession();
  localStorage.removeItem("astroguide_account");
}

async function request(path, options = {}) {
  const session = await getValidSession();
  const token = session?.access_token;
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: { ...headers(token), ...(options.headers || {}) }
  });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || data?.error || "Ошибка сервера.");
  return data;
}

async function serverRequest(path, options = {}) {
  const session = await getValidSession();
  if (!session?.access_token || !session?.user?.id) {
    throw new Error("Войдите в аккаунт.");
  }
  const response = await fetch(`${SERVER_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
      Authorization: `Bearer ${session.access_token}`
    }
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || "Ошибка сервера.");
  return data;
}

export async function getCloudCharts() {
  if (!cloudConfigured) return null;
  const session = await getValidSession();
  if (!session?.access_token || !session?.user?.id) return [];
  const data = await serverRequest("/api/charts");
  return data.charts || [];
}

export async function saveCloudChart(chart) {
  if (!cloudConfigured) return null;
  const data = await serverRequest("/api/charts", {
    method: "POST",
    body: JSON.stringify({
      date: chart.date,
      time: chart.time,
      city: chart.city,
      timezone: chart.timezone || null,
      latitude: chart.latitude ?? null,
      longitude: chart.longitude ?? null,
      premium: Boolean(chart.premium)
    })
  });
  return data.chart || null;
}

export async function deleteCloudChart(id) {
  if (!cloudConfigured) return null;
  return serverRequest(`/api/charts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function getServerSessionToken() {
  const session = await getValidSession();
  return session?.access_token || null;
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}
