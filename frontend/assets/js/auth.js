// auth.js — autenticação por e-mail + senha contra o backend próprio.
// Guarda a sessão (access/refresh) via apiClient; expõe o usuário em window.PE.user.

import { request, getSession, setSession, clearSession } from './apiClient.js';

let _user = null;
const _listeners = new Set();

export function currentUser() {
  return _user;
}

export function isLoggedIn() {
  return Boolean(_user);
}

// Registra um callback chamado quando o estado de auth muda. Retorna unsubscribe.
export function onAuthChange(cb) {
  _listeners.add(cb);
  cb(_user);
  return () => _listeners.delete(cb);
}

function setUser(user) {
  _user = user || null;
  if (typeof window !== 'undefined') {
    window.PE = window.PE || {};
    window.PE.user = _user;
  }
  _listeners.forEach((cb) => cb(_user));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(email) {
  return EMAIL_RE.test(String(email || '').trim());
}

function persist(data) {
  setSession({ access: data.access_token, refresh: data.refresh_token, user: data.user });
  setUser(data.user);
}

// Cadastra (e já loga). Retorna { ok, error? }.
export async function signUp(email, password) {
  if (!isValidEmail(email)) return { ok: false, error: 'E-mail inválido' };
  const { status, data } = await request('/auth/signup', {
    method: 'POST',
    body: { email: String(email).trim(), password: String(password || '') },
  });
  if (status === 201) {
    persist(data);
    return { ok: true };
  }
  return { ok: false, error: (data && data.error) || 'Falha ao cadastrar' };
}

// Entra com e-mail e senha. Retorna { ok, error? }.
export async function signIn(email, password) {
  if (!isValidEmail(email)) return { ok: false, error: 'E-mail inválido' };
  const { status, data } = await request('/auth/login', {
    method: 'POST',
    body: { email: String(email).trim(), password: String(password || '') },
  });
  if (status === 200) {
    persist(data);
    return { ok: true };
  }
  return { ok: false, error: (data && data.error) || 'E-mail ou senha inválidos' };
}

export async function signOut() {
  const s = getSession();
  if (s && s.refresh) {
    try {
      await request('/auth/logout', { method: 'POST', body: { refresh_token: s.refresh } });
    } catch {
      /* ignora erro de rede no logout */
    }
  }
  clearSession();
  setUser(null);
}

// Inicializa: se há sessão salva, valida via /auth/me e publica o usuário.
// Idempotente; chamada sob demanda (#M12) via window.PE.ensureAuth.
let _initStarted = false;
export async function initAuth() {
  if (_initStarted) return;
  _initStarted = true;
  const s = getSession();
  if (!s || !s.access) {
    _initStarted = false; // sem sessão: permite re-tentar após login
    return;
  }
  try {
    const { status, data } = await request('/auth/me', { auth: true });
    if (status === 200 && data && data.user) setUser(data.user);
    else clearSession();
  } catch {
    /* offline: mantém o que tiver */
  }
}
