// savedPrompts.js — persistência de prompts salvos.
// Logado → nuvem (API /api/prompts, escopado ao usuário do JWT); deslogado →
// fallback local em localStorage (offline-first).

import { isLoggedIn } from './auth.js';
import { request } from './apiClient.js';

const LS_KEY = 'pe:saved-prompts';
const LS_COLS_KEY = 'pe:collections';
const MAX_LOCAL = 50;

// ---- localStorage helpers ----

function localList() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    const arr = Array.isArray(raw) ? raw : [];
    return arr.map((x) => ({ collection: null, tags: [], favorite: false, ...x }));
  } catch {
    return [];
  }
}
function localWrite(list) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, MAX_LOCAL)));
  } catch {
    /* sem storage */
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

// ---- Prompts salvos ----

// Salva um prompt. Retorna { ok, where:'cloud'|'local', error?, needsAuth? }.
export async function savePrompt({ template, content, title, collection, tags, favorite } = {}) {
  const text = String(content || '').trim();
  if (!text) return { ok: false, error: 'empty' };

  if (isLoggedIn()) {
    try {
      const { status, data } = await request('/prompts', {
        method: 'POST',
        auth: true,
        body: {
          template: template || null,
          title: title || null,
          content: text,
          collection: collection || null,
          tags: tags || [],
          favorite: favorite || false,
        },
      });
      if (status === 201) return { ok: true, where: 'cloud' };
      if (status === 401) return { ok: false, error: 'auth', needsAuth: true };
      return { ok: false, error: (data && data.error) || 'Falha ao salvar' };
    } catch {
      /* rede caiu: cai no fallback local abaixo */
    }
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
export async function updateSavedPrompt(id, patch = {}) {
  if (isLoggedIn()) {
    try {
      const { ok } = await request(`/prompts/${id}`, { method: 'PATCH', auth: true, body: patch });
      return ok;
    } catch {
      return false;
    }
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
  if (isLoggedIn()) {
    try {
      const { status, data } = await request('/prompts', { auth: true });
      if (status !== 200) return [];
      return (data.prompts || []).map((x) => ({
        collection: null,
        tags: [],
        favorite: false,
        ...x,
      }));
    } catch {
      return [];
    }
  }
  return localList();
}

// Remove um prompt salvo (id uuid na nuvem; ts no local).
export async function deleteSavedPrompt(id) {
  if (isLoggedIn()) {
    try {
      const { ok } = await request(`/prompts/${id}`, { method: 'DELETE', auth: true });
      return ok;
    } catch {
      return false;
    }
  }
  localWrite(localList().filter((x) => x.ts !== id));
  return true;
}

// ---- Coleções ----

export async function listCollections() {
  if (isLoggedIn()) {
    try {
      const { status, data } = await request('/collections', { auth: true });
      return status === 200 ? data.collections || [] : [];
    } catch {
      return [];
    }
  }
  return localColsList().map(({ id, name }) => ({ id, name }));
}

export async function createCollection(name) {
  const n = String(name || '').trim();
  if (!n) return { ok: false, error: 'empty' };

  if (isLoggedIn()) {
    try {
      const { status, data } = await request('/collections', {
        method: 'POST',
        auth: true,
        body: { name: n },
      });
      if (status === 201) return { ok: true, id: data.collection.id };
      return { ok: false, error: (data && data.error) || 'Falha ao criar coleção' };
    } catch {
      return { ok: false, error: 'offline' };
    }
  }

  const id = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const cols = localColsList();
  cols.push({ id, name: n, ts: new Date().toISOString() });
  localColsWrite(cols);
  return { ok: true, id };
}

export async function renameCollection(id, name) {
  const n = String(name || '').trim();
  if (!n) return false;

  if (isLoggedIn()) {
    try {
      const { ok } = await request(`/collections/${id}`, {
        method: 'PATCH',
        auth: true,
        body: { name: n },
      });
      return ok;
    } catch {
      return false;
    }
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
  if (isLoggedIn()) {
    try {
      const { ok } = await request(`/collections/${id}`, { method: 'DELETE', auth: true });
      return ok;
    } catch {
      return false;
    }
  }
  const prompts = localList();
  localWrite(prompts.map((p) => (p.collection === id ? { ...p, collection: null } : p)));
  localColsWrite(localColsList().filter((c) => c.id !== id));
  return true;
}
