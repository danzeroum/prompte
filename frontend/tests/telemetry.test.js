import { track, getQueue, clearQueue, flush } from '../assets/js/telemetry.js';

describe('telemetry', () => {
  beforeEach(() => {
    localStorage.clear();
    clearQueue();
  });

  afterEach(() => {
    if (typeof window !== 'undefined' && window.PE) delete window.PE.user;
  });

  it('enfileira um evento com o formato esperado', () => {
    const ev = track('generate', { template: 'review' });
    expect(ev.type).toBe('generate');
    expect(ev.sessionId).toBeTruthy();
    expect(ev.payload).toEqual({ template: 'review' });
    expect(getQueue()).toHaveLength(1);
  });

  it('userId é null quando anônimo e preenchido quando há sessão (#M20)', () => {
    expect(track('pageview', {}).userId).toBeNull();
    window.PE = { user: { id: 'user-123' } };
    expect(track('pageview', {}).userId).toBe('user-123');
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
