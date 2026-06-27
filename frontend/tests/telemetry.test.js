import { jest } from '@jest/globals';

const request = jest.fn();
jest.unstable_mockModule('../assets/js/apiClient.js', () => ({ request }));

const { track, getQueue, clearQueue, flush } = await import('../assets/js/telemetry.js');

describe('telemetry', () => {
  beforeEach(() => {
    localStorage.clear();
    clearQueue();
    request.mockReset();
  });

  it('enfileira um evento com o formato esperado', () => {
    const ev = track('generate', { template: 'review' });
    expect(ev.type).toBe('generate');
    expect(ev.sessionId).toBeTruthy();
    expect(ev.payload).toEqual({ template: 'review' });
    expect(getQueue()).toHaveLength(1);
  });

  it('flush envia para /api/events e remove os enviados', async () => {
    track('pageview', {});
    track('generate', { k: 1 });
    request.mockResolvedValue({ ok: true, status: 200, data: { sent: 2 } });
    const res = await flush();
    expect(request).toHaveBeenCalledWith(
      '/events',
      expect.objectContaining({
        method: 'POST',
        auth: true,
        body: expect.objectContaining({ events: expect.any(Array) }),
      }),
    );
    expect(res.sent).toBe(2);
    expect(getQueue()).toHaveLength(0);
  });

  it('quando a rede falha, flush mantém a fila pendente', async () => {
    track('pageview', {});
    request.mockRejectedValue(new Error('network'));
    const res = await flush();
    expect(res.sent).toBe(0);
    expect(res.pending).toBe(1);
    expect(getQueue()).toHaveLength(1);
  });

  it('flush vazio não envia nada', async () => {
    const res = await flush();
    expect(res).toEqual({ sent: 0, pending: 0 });
    expect(request).not.toHaveBeenCalled();
  });
});
