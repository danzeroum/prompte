// apiClient.js — cliente REST do backend próprio (substitui o supabase-js).
// Fala com a API em VITE_API_URL (default /api, mesma origem). Guarda a sessão
// (access + refresh + user) no localStorage e renova o access token em 401.

const API_BASE = String(
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || '/api',
).replace(/\/$/, '');

const SESSION_KEY = 'pe:auth';

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}
export function setSession(s) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    /* sem storage */
  }
}
export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* noop */
  }
}

// Mantido por compatibilidade com a degradação graciosa (#M8): a API é mesma
// origem, então "configurado" é sempre verdadeiro quando há base definida.
export function isConfigured() {
  return Boolean(API_BASE);
}

async function refreshAccess() {
  const s = getSession();
  if (!s || !s.refresh) return null;
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refresh_token: s.refresh }),
  });
  if (!res.ok) {
    clearSession();
    return null;
  }
  const data = await res.json();
  setSession({ ...s, access: data.access_token });
  return data.access_token;
}

// request(path, { method, body, auth, headers }) → { ok, status, data }.
// Lança apenas em erro de rede (caller trata com try/catch p/ fallback offline).
export async function request(path, opts = {}) {
  const { method = 'GET', body, auth = false, headers = {} } = opts;
  const h = { ...headers };
  if (body !== undefined) h['content-type'] = 'application/json';
  if (auth) {
    const s = getSession();
    if (s && s.access) h.authorization = `Bearer ${s.access}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: h,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  // Access expirou? Tenta renovar uma vez e repete.
  if (res.status === 401 && auth && !opts._retried) {
    const access = await refreshAccess();
    if (access) return request(path, { ...opts, _retried: true });
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* corpo vazio/não-JSON */
  }
  return { ok: res.ok, status: res.status, data };
}
