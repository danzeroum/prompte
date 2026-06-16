// savedPrompts.js — persistência de prompts salvos pelo usuário.
// Estratégia: nuvem-primeiro quando o Supabase está configurado e há sessão
// (tabela public.saved_prompts com RLS por user_id); caso contrário, fallback
// local em localStorage (offline-first), espelhando o padrão de promptHistory.
// O insert SEMPRE envia user_id explícito — a RLS valida no insert, mas o valor
// precisa vir do cliente, senão a policy rejeita.

import { getSupabase, isConfigured } from './supabaseClient.js';

const LS_KEY = 'pe:saved-prompts';
const LS_COLS_KEY = 'pe:collections';
// Diferente do histórico (MAX=20, efêmero): prompts salvos são intencionais.
// Mantemos um teto generoso no fallback local para não crescer sem limite.
const MAX_LOCAL = 50;

// ---- localStorage helpers ----

function localList() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    const arr = Array.isArray(raw) ? raw : [];
    // Migração defensiva: adiciona campos novos com defaults para itens antigos.
    return arr.map((x) => ({
      collection: null,
      tags: [],
      favorite: false,
      ...x,
    }));
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

function localColsList() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_COLS_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function localColsWrite(list) {
  try {
    localStorage.setItem(LS_COLS_KEY, JSON.stringify(list));
  } catch {
    /* ignora */
  }
}

// ---- Supabase helper ----

async function userClient() {
  if (!isConfigured()) return { supabase: null, user: null };
  const supabase = await getSupabase();
  if (!supabase) return { supabase: null, user: null };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user: user || null };
}

// ---- Prompts salvos ----

// Salva um prompt. Retorna { ok, where:'cloud'|'local', error?, needsAuth? }.
export async function savePrompt({ template, content, title, collection, tags, favorite } = {}) {
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
      collection: collection || null,
      tags: tags || [],
      favorite: favorite || false,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, where: 'cloud' };
  }

  const list = localList();
  list.unshift({
    template: String(template || ''),
    title: String(title || ''),
    content: text,
    collection: collection || null,
    tags: Array.isArray(tags) ? tags : [],
    favorite: favorite || false,
    ts: new Date().toISOString(),
  });
  localWrite(list);
  return { ok: true, where: 'local' };
}

// Atualiza campos de um prompt salvo (patch parcial).
// Na nuvem: UPDATE por id. No local: reescrita do item por ts.
export async function updateSavedPrompt(id, patch = {}) {
  const { supabase, user } = await userClient();
  if (supabase && user) {
    const { error } = await supabase.from('saved_prompts').update(patch).eq('id', id);
    return !error;
  }
  const list = localList();
  const idx = list.findIndex((x) => x.ts === id);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], ...patch };
  localWrite(list);
  return true;
}

// Lista os prompts salvos (nuvem se logado, senão local). Sempre array.
export async function listSavedPrompts() {
  const { supabase, user } = await userClient();
  if (supabase && user) {
    const { data, error } = await supabase
      .from('saved_prompts')
      .select('id, template, title, content, created_at, collection, tags, favorite')
      .order('created_at', { ascending: false });
    return error
      ? []
      : (data || []).map((x) => ({
          collection: null,
          tags: [],
          favorite: false,
          ...x,
        }));
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

// ---- Coleções ----

// Lista coleções do usuário. Retorna [{ id, name }].
export async function listCollections() {
  const { supabase, user } = await userClient();
  if (supabase && user) {
    const { data, error } = await supabase
      .from('collections')
      .select('id, name')
      .order('created_at', { ascending: true });
    return error ? [] : data || [];
  }
  return localColsList().map(({ id, name }) => ({ id, name }));
}

// Cria uma coleção. Retorna { ok, id }.
export async function createCollection(name) {
  const n = String(name || '').trim();
  if (!n) return { ok: false, error: 'empty' };

  const { supabase, user } = await userClient();
  if (supabase && user) {
    const { data, error } = await supabase
      .from('collections')
      .insert({ user_id: user.id, name: n })
      .select('id')
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data.id };
  }

  const id = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const cols = localColsList();
  cols.push({ id, name: n, ts: new Date().toISOString() });
  localColsWrite(cols);
  return { ok: true, id };
}

// Renomeia uma coleção.
export async function renameCollection(id, name) {
  const n = String(name || '').trim();
  if (!n) return false;

  const { supabase, user } = await userClient();
  if (supabase && user) {
    const { error } = await supabase.from('collections').update({ name: n }).eq('id', id);
    return !error;
  }
  const cols = localColsList();
  const idx = cols.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  cols[idx].name = n;
  localColsWrite(cols);
  return true;
}

// Exclui uma coleção; prompts ficam com collection:null (não apaga prompts).
export async function deleteCollection(id) {
  const { supabase, user } = await userClient();
  if (supabase && user) {
    // ON DELETE SET NULL no schema cuida dos prompts na nuvem.
    const { error } = await supabase.from('collections').delete().eq('id', id);
    return !error;
  }
  // No local: zerar collection nos prompts que apontavam para ela.
  const prompts = localList();
  localWrite(prompts.map((p) => (p.collection === id ? { ...p, collection: null } : p)));
  const cols = localColsList();
  localColsWrite(cols.filter((c) => c.id !== id));
  return true;
}
