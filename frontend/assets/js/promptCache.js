// promptCache.js — leitura do cache de respostas da LLM (Fase B).
// O cliente apenas LÊ o cache (por hash da requisição); a escrita é feita
// exclusivamente pela Edge Function (service_role) na Fase C, evitando
// cache poisoning. A RLS já oculta entradas expiradas, então uma linha
// ausente equivale a "miss".

import { getSupabase } from './supabaseClient.js';

// Gera o hash determinístico (sha256 hex) de uma requisição. Aceita string
// ou objeto (ex.: { messages, temperature }). Usa Web Crypto (navegador/Node 20+).
export async function hashRequest(payload) {
  const text = typeof payload === 'string' ? payload : stableStringify(payload);
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// JSON estável (chaves ordenadas) para que objetos equivalentes gerem o mesmo hash.
function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

// Consulta o cache. Retorna a resposta cacheada (fresca) ou null em caso de
// miss / sem Supabase configurado.
export async function getCachedResponse(payload) {
  const client = await getSupabase();
  if (!client) return null;
  const hash = await hashRequest(payload);
  const { data, error } = await client
    .from('prompt_cache')
    .select('response')
    .eq('hash', hash)
    .maybeSingle();
  if (error || !data) return null;
  return data.response;
}
