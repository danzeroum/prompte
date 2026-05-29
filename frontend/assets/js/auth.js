// auth.js — autenticação por magic link (Fase D.2).
// Usa Supabase Auth (signInWithOtp). Quando logado, o supabase-js anexa o JWT
// do usuário às chamadas, então a Edge Function aplica o limite maior de rate
// limiting automaticamente. Sem Supabase configurado, vira no-op.

import { getSupabase } from './supabaseClient.js';

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

// Envia o magic link para o e-mail. Retorna { ok, error }.
export async function signInWithEmail(email) {
  if (!isValidEmail(email)) return { ok: false, error: 'E-mail inválido' };
  const supabase = await getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase não configurado' };
  const redirect = typeof location !== 'undefined' ? location.href.split('#')[0] : undefined;
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: redirect ? { emailRedirectTo: redirect } : undefined,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function signOut() {
  const supabase = await getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
  setUser(null);
}

// Inicializa: lê a sessão atual e assina mudanças de estado. Idempotente — só
// resolve o cliente (e carrega o SDK) uma vez (#M12: chamada sob demanda).
let _initStarted = false;
export async function initAuth() {
  if (_initStarted) return;
  _initStarted = true;
  const supabase = await getSupabase();
  if (!supabase) {
    _initStarted = false; // sem config: permite re-tentar se for configurado depois
    return;
  }
  const { data } = await supabase.auth.getSession();
  setUser(data?.session?.user ?? null);
  supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
}
