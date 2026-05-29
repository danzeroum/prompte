// savedPrompts.js — persistência de prompts salvos pelo usuário (Fase 3b).
// Estratégia: nuvem-primeiro quando o Supabase está configurado e há sessão
// (tabela public.saved_prompts com RLS por user_id); caso contrário, fallback
// local em localStorage (offline-first), espelhando o padrão de promptHistory.
// O insert SEMPRE envia user_id explícito — a RLS valida no insert, mas o valor
// precisa vir do cliente, senão a policy rejeita.

import { getSupabase, isConfigured } from './supabaseClient.js';

const LS_KEY = 'pe:saved-prompts';
// Diferente do histórico (MAX=20, efêmero): prompts salvos são intencionais.
// Mantemos um teto generoso no fallback local para não crescer sem limite.
const MAX_LOCAL = 50;

function localList() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}
function localWrite(list) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, MAX_LOCAL)));
  } catch {
    /* sem storage: ignora */
  }
}

async function userClient() {
  if (!isConfigured()) return { supabase: null, user: null };
  const supabase = await getSupabase();
  if (!supabase) return { supabase: null, user: null };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user: user || null };
}

// Salva um prompt. Retorna { ok, where:'cloud'|'local', error?, needsAuth? }.
export async function savePrompt({ template, content, title } = {}) {
  const text = String(content || '').trim();
  if (!text) return { ok: false, error: 'empty' };

  const { supabase, user } = await userClient();
  if (supabase) {
    if (!user) return { ok: false, error: 'auth', needsAuth: true };
    const { error } = await supabase.from('saved_prompts').insert({
      user_id: user.id,
      template: template || null,
      title: title || null,
      content: text,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, where: 'cloud' };
  }

  const list = localList();
  list.unshift({
    template: String(template || ''),
    title: String(title || ''),
    content: text,
    ts: new Date().toISOString(),
  });
  localWrite(list);
  return { ok: true, where: 'local' };
}

// Lista os prompts salvos (nuvem se logado, senão local). Sempre array.
export async function listSavedPrompts() {
  const { supabase, user } = await userClient();
  if (supabase && user) {
    const { data, error } = await supabase
      .from('saved_prompts')
      .select('id, template, title, content, created_at')
      .order('created_at', { ascending: false });
    return error ? [] : data || [];
  }
  return localList();
}

// Remove um prompt salvo. Na nuvem usa o id (uuid); no local usa o ts.
export async function deleteSavedPrompt(id) {
  const { supabase, user } = await userClient();
  if (supabase && user) {
    const { error } = await supabase.from('saved_prompts').delete().eq('id', id);
    return !error;
  }
  localWrite(localList().filter((x) => x.ts !== id));
  return true;
}
