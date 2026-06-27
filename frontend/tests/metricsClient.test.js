import { jest } from '@jest/globals';

const request = jest.fn();
jest.unstable_mockModule('../assets/js/apiClient.js', () => ({ request }));

const { fetchMetrics } = await import('../assets/js/metricsClient.js');

describe('fetchMetrics', () => {
  beforeEach(() => request.mockReset());

  it('retorna as métricas em sucesso (200)', async () => {
    request.mockResolvedValue({ ok: true, status: 200, data: { total_events: 3 } });
    const m = await fetchMetrics();
    expect(request).toHaveBeenCalledWith('/metrics', { auth: true });
    expect(m.total_events).toBe(3);
  });

  it('propaga 403 com status', async () => {
    request.mockResolvedValue({ ok: false, status: 403, data: { error: 'Acesso restrito' } });
    const err = await fetchMetrics().catch((e) => e);
    expect(err.status).toBe(403);
    expect(err.message).toMatch(/restrito/i);
  });
});
