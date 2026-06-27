import { jest } from '@jest/globals';

// Mocka as dependências de módulo (ESM) antes de importar o llmClient.
const getCachedResponse = jest.fn();
const request = jest.fn();
const track = jest.fn();

jest.unstable_mockModule('../assets/js/promptCache.js', () => ({ getCachedResponse }));
jest.unstable_mockModule('../assets/js/apiClient.js', () => ({ request }));
jest.unstable_mockModule('../assets/js/telemetry.js', () => ({ track }));

const { askLLM, buildLlmEvent } = await import('../assets/js/llmClient.js');

describe('buildLlmEvent', () => {
  it('normaliza o evento de telemetria', () => {
    expect(buildLlmEvent({ cacheHit: true, durationMs: 12, model: 'deepseek-chat' })).toEqual({
      cache_hit: true,
      duration_ms: 12,
      model: 'deepseek-chat',
    });
    expect(buildLlmEvent({ cacheHit: undefined, durationMs: 5, error: true })).toEqual({
      cache_hit: false,
      duration_ms: 5,
      model: null,
      error: true,
    });
    expect(buildLlmEvent({ durationMs: 7, error: true, rateLimited: true })).toEqual({
      cache_hit: false,
      duration_ms: 7,
      model: null,
      error: true,
      rate_limited: true,
    });
  });
});

describe('askLLM', () => {
  beforeEach(() => {
    getCachedResponse.mockReset();
    request.mockReset();
    track.mockReset();
  });

  it('retorna do cache sem chamar a API', async () => {
    getCachedResponse.mockResolvedValue({ content: 'oi', model: 'deepseek-chat' });
    const res = await askLLM([{ role: 'user', content: 'oi' }]);
    expect(res).toEqual({ content: 'oi', model: 'deepseek-chat', cache_hit: true });
    expect(request).not.toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith('llm_request', expect.objectContaining({ cache_hit: true }));
  });

  it('chama POST /api/llm em cache miss', async () => {
    getCachedResponse.mockResolvedValue(null);
    request.mockResolvedValue({
      ok: true,
      status: 200,
      data: { content: 'resposta', model: 'deepseek-chat', cache_hit: false },
    });
    const res = await askLLM([{ role: 'user', content: 'oi' }], 0.5);
    expect(request).toHaveBeenCalledWith(
      '/llm',
      expect.objectContaining({
        method: 'POST',
        auth: true,
        body: { messages: [{ role: 'user', content: 'oi' }], temperature: 0.5 },
        headers: { 'x-request-id': expect.any(String) },
      }),
    );
    expect(res.content).toBe('resposta');
    expect(track).toHaveBeenCalledWith(
      'llm_request',
      expect.objectContaining({ request_id: expect.any(String) }),
    );
    expect(track).toHaveBeenCalledWith(
      'llm_request',
      expect.objectContaining({ cache_hit: false }),
    );
  });

  it('rejeita messages vazio', async () => {
    await expect(askLLM([])).rejects.toThrow(/array/);
  });

  it('propaga 429 como erro com flag rateLimited', async () => {
    getCachedResponse.mockResolvedValue(null);
    request.mockResolvedValue({
      ok: false,
      status: 429,
      data: { error: 'Limite atingido', reset_at: '2026-01-01T00:00:00Z' },
    });
    const err = await askLLM([{ role: 'user', content: 'oi' }]).catch((e) => e);
    expect(err.status).toBe(429);
    expect(err.rateLimited).toBe(true);
    expect(err.resetAt).toBe('2026-01-01T00:00:00Z');
    expect(err.message).toMatch(/Limite/);
    expect(track).toHaveBeenCalledWith(
      'llm_request',
      expect.objectContaining({ rate_limited: true }),
    );
  });
});
