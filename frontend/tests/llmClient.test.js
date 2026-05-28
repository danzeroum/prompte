import { jest } from '@jest/globals';

// Mocka as dependências de módulo (ESM) antes de importar o llmClient.
const getCachedResponse = jest.fn();
const getSupabase = jest.fn();
const track = jest.fn();

jest.unstable_mockModule('../assets/js/promptCache.js', () => ({ getCachedResponse }));
jest.unstable_mockModule('../assets/js/supabaseClient.js', () => ({ getSupabase }));
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
  });
});

describe('askLLM', () => {
  beforeEach(() => {
    getCachedResponse.mockReset();
    getSupabase.mockReset();
    track.mockReset();
  });

  it('retorna do cache sem invocar a Edge Function', async () => {
    getCachedResponse.mockResolvedValue({ content: 'oi', model: 'deepseek-chat' });
    const res = await askLLM([{ role: 'user', content: 'oi' }]);
    expect(res).toEqual({ content: 'oi', model: 'deepseek-chat', cache_hit: true });
    expect(getSupabase).not.toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith('llm_request', expect.objectContaining({ cache_hit: true }));
  });

  it('invoca a Edge Function em cache miss', async () => {
    getCachedResponse.mockResolvedValue(null);
    const invoke = jest.fn().mockResolvedValue({
      data: { content: 'resposta', model: 'deepseek-chat', cache_hit: false },
      error: null,
    });
    getSupabase.mockResolvedValue({ functions: { invoke } });

    const res = await askLLM([{ role: 'user', content: 'oi' }], 0.5);
    expect(invoke).toHaveBeenCalledWith('prompt-llm', {
      body: { messages: [{ role: 'user', content: 'oi' }], temperature: 0.5 },
    });
    expect(res.content).toBe('resposta');
    expect(track).toHaveBeenCalledWith('llm_request', expect.objectContaining({ cache_hit: false }));
  });

  it('rejeita messages vazio', async () => {
    await expect(askLLM([])).rejects.toThrow(/array/);
  });
});
