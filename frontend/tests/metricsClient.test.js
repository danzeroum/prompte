import { jest } from '@jest/globals';

const getSupabase = jest.fn();
jest.unstable_mockModule('../assets/js/supabaseClient.js', () => ({ getSupabase }));

const { fetchMetrics } = await import('../assets/js/metricsClient.js');

describe('fetchMetrics', () => {
  beforeEach(() => getSupabase.mockReset());

  it('retorna as métricas em sucesso', async () => {
    const invoke = jest.fn().mockResolvedValue({ data: { total_events: 3 }, error: null });
    getSupabase.mockResolvedValue({ functions: { invoke } });
    const m = await fetchMetrics();
    expect(invoke).toHaveBeenCalledWith('metrics', { body: {} });
    expect(m.total_events).toBe(3);
  });

  it('propaga 403 com status', async () => {
    const context = { status: 403, clone: () => ({ json: async () => ({ error: 'Acesso restrito' }) }) };
    const invoke = jest.fn().mockResolvedValue({ data: null, error: { context, message: 'http' } });
    getSupabase.mockResolvedValue({ functions: { invoke } });
    const err = await fetchMetrics().catch((e) => e);
    expect(err.status).toBe(403);
    expect(err.message).toMatch(/restrito/i);
  });

  it('erro sem Supabase configurado', async () => {
    getSupabase.mockResolvedValue(null);
    await expect(fetchMetrics()).rejects.toThrow(/Supabase/);
  });
});
