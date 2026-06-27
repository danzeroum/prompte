// Hash determinístico do request de LLM — DEVE ser idêntico ao do cliente
// (frontend/assets/js/promptCache.js) para que a leitura do cache bata com a
// escrita do servidor. Mesma stableStringify + sha256.
import crypto from 'node:crypto';

export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

export const sha256Hex = (text) => crypto.createHash('sha256').update(text).digest('hex');

export const requestHash = (messages, temperature) =>
  sha256Hex(stableStringify({ messages, temperature }));
