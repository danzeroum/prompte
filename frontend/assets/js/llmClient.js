// llmClient.js — cliente da LLM (Fase C).
// Antes de invocar a Edge Function (que custa $), tenta o cache no banco.
// Em hit, retorna sem rede/custo. Sempre registra telemetria do pedido.

import { getSupabase } from './supabaseClient.js';
import { getCachedResponse } from './promptCache.js';
import { track } from './telemetry.js';

const FUNCTION_NAME = 'prompt-llm';

// Monta o evento de telemetria de um pedido à LLM (helper puro/testável).
export function buildLlmEvent({ cacheHit, durationMs, model, error, rateLimited, requestId }) {
  return {
    cache_hit: Boolean(cacheHit),
    duration_ms: durationMs,
    model: model ?? null,
    ...(requestId ? { request_id: requestId } : {}),
    ...(error ? { error: true } : {}),
    ...(rateLimited ? { rate_limited: true } : {}),
  };
}

// Gera um id de correlação (#10) propagado à Edge Function e à telemetria.
function newRequestId() {
  return (
    (crypto.randomUUID && crypto.randomUUID()) ||
    `r-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

// messages: [{ role, content }]; temperature: number (default 0.3).
// Retorna { content, model, cache_hit }.
export async function askLLM(messages, temperature = 0.3) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('`messages` deve ser um array não vazio');
  }
  const request = { messages, temperature };
  const started = Date.now();
  const requestId = newRequestId();

  // 1) Cache client-side (leitura direta por hash; evita até invocar a função).
  const cached = await getCachedResponse(request);
  if (cached) {
    track(
      'llm_request',
      buildLlmEvent({
        cacheHit: true,
        durationMs: Date.now() - started,
        model: cached.model,
        requestId,
      }),
    );
    return { ...cached, cache_hit: true };
  }

  // 2) Cache miss -> invoca a Edge Function (que também cacheia o resultado).
  const client = await getSupabase();
  if (!client) throw new Error('Supabase não configurado');

  const { data, error } = await client.functions.invoke(FUNCTION_NAME, {
    body: request,
    headers: { 'x-request-id': requestId },
  });
  if (error) {
    // supabase-js v2 expõe a resposta HTTP em error.context (FunctionsHttpError).
    const status = error.context?.status;
    let detail;
    try {
      detail = error.context ? await error.context.clone().json() : undefined;
    } catch {
      detail = undefined;
    }
    const rateLimited = status === 429;
    track(
      'llm_request',
      buildLlmEvent({
        cacheHit: false,
        durationMs: Date.now() - started,
        error: true,
        rateLimited,
        requestId,
      }),
    );
    const thrown = new Error(detail?.error || error.message || 'Falha ao chamar a LLM');
    thrown.status = status;
    thrown.rateLimited = rateLimited;
    if (detail?.reset_at) thrown.resetAt = detail.reset_at;
    throw thrown;
  }
  track(
    'llm_request',
    buildLlmEvent({
      cacheHit: data?.cache_hit,
      durationMs: Date.now() - started,
      model: data?.model,
      requestId,
    }),
  );
  return data;
}
