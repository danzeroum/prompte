// promptCache.js — leitura do cache de respostas da LLM.
// O cliente só LÊ (por hash); a escrita é da API (/api/llm). Hash determinístico
// idêntico ao do servidor (api/src/hash.js) para a leitura bater com a escrita.

import { request } from './apiClient.js';

// sha256 hex de uma requisição (string ou objeto { messages, temperature }).
export async function hashRequest(payload) {
  const text = typeof payload === 'string' ? payload : stableStringify(payload);
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// JSON estável (chaves ordenadas) para objetos equivalentes gerarem o mesmo hash.
function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

// Consulta o cache. Retorna a resposta cacheada (fresca) ou null (miss/offline).
export async function getCachedResponse(payload) {
  try {
    const hash = await hashRequest(payload);
    const { status, data } = await request(`/cache/${hash}`);
    if (status === 200 && data && data.response) return data.response;
    return null;
  } catch {
    return null;
  }
}
