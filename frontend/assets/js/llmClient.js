// llmClient.js — cliente da LLM (Fase C).
// Antes de invocar a Edge Function (que custa $), tenta o cache no banco.
// Em hit, retorna sem rede/custo. Sempre registra telemetria do pedido.

import { getSupabase } from './supabaseClient.js';
import { getCachedResponse } from './promptCache.js';
import { track } from './telemetry.js';

const FUNCTION_NAME = 'prompt-llm';

// Monta o evento de telemetria de um pedido à LLM (helper puro/testável).
export function buildLlmEvent({ cacheHit, durationMs, model, error }) {
  return {
    cache_hit: Boolean(cacheHit),
    duration_ms: durationMs,
    model: model ?? null,
    ...(error ? { error: true } : {}),
  };
}

// messages: [{ role, content }]; temperature: number (default 0.3).
// Retorna { content, model, cache_hit }.
export async function askLLM(messages, temperature = 0.3) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('`messages` deve ser um array não vazio');
  }
  const request = { messages, temperature };
  const started = Date.now();

  // 1) Cache client-side (leitura direta por hash; evita até invocar a função).
  const cached = await getCachedResponse(request);
  if (cached) {
    track(
      'llm_request',
      buildLlmEvent({ cacheHit: true, durationMs: Date.now() - started, model: cached.model }),
    );
    return { ...cached, cache_hit: true };
  }

  // 2) Cache miss -> invoca a Edge Function (que também cacheia o resultado).
  const client = await getSupabase();
  if (!client) throw new Error('Supabase não configurado');

  const { data, error } = await client.functions.invoke(FUNCTION_NAME, { body: request });
  if (error) {
    track(
      'llm_request',
      buildLlmEvent({ cacheHit: false, durationMs: Date.now() - started, error: true }),
    );
    throw error;
  }
  track(
    'llm_request',
    buildLlmEvent({
      cacheHit: data?.cache_hit,
      durationMs: Date.now() - started,
      model: data?.model,
    }),
  );
  return data;
}
