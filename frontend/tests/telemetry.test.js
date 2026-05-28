import { track, getQueue, clearQueue, flush } from '../assets/js/telemetry.js';

describe('telemetry', () => {
  beforeEach(() => {
    localStorage.clear();
    clearQueue();
  });

  it('enfileira um evento com o formato esperado', () => {
    const ev = track('generate', { template: 'review' });
    expect(ev.type).toBe('generate');
    expect(ev.sessionId).toBeTruthy();
    expect(ev.payload).toEqual({ template: 'review' });
    expect(getQueue()).toHaveLength(1);
  });

  it('sem Supabase configurado, flush mantém a fila pendente', async () => {
    track('pageview', {});
    const res = await flush();
    expect(res.sent).toBe(0);
    expect(res.pending).toBe(1);
    expect(getQueue()).toHaveLength(1);
  });

  it('flush vazio não envia nada', async () => {
    const res = await flush();
    expect(res).toEqual({ sent: 0, pending: 0 });
  });
});
