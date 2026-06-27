// llmClient.js — cliente da LLM. Tenta o cache (leitura) antes de chamar a API
// /api/llm (que também cacheia). Sempre registra telemetria do pedido.

import { request } from './apiClient.js';
import { getCachedResponse } from './promptCache.js';
import { track } from './telemetry.js';

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

// Id de correlação (#10) propagado à API (x-request-id) e à telemetria.
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
  const body = { messages, temperature };
  const started = Date.now();
  const requestId = newRequestId();

  // 1) Cache client-side (evita até chamar a API).
  const cached = await getCachedResponse(body);
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

  // 2) Cache miss → POST /api/llm.
  let res;
  try {
    res = await request('/llm', {
      method: 'POST',
      auth: true,
      body,
      headers: { 'x-request-id': requestId },
    });
  } catch {
    track(
      'llm_request',
      buildLlmEvent({ cacheHit: false, durationMs: Date.now() - started, error: true, requestId }),
    );
    throw new Error('Falha ao chamar a LLM');
  }

  if (!res.ok) {
    const status = res.status;
    const detail = res.data;
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
    const thrown = new Error((detail && detail.error) || 'Falha ao chamar a LLM');
    thrown.status = status;
    thrown.rateLimited = rateLimited;
    if (detail && detail.reset_at) thrown.resetAt = detail.reset_at;
    throw thrown;
  }

  track(
    'llm_request',
    buildLlmEvent({
      cacheHit: res.data && res.data.cache_hit,
      durationMs: Date.now() - started,
      model: res.data && res.data.model,
      requestId,
    }),
  );
  return res.data;
}
