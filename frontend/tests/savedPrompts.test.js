import { savePrompt, listSavedPrompts, deleteSavedPrompt } from '../assets/js/savedPrompts.js';

// Sem VITE_SUPABASE_* no ambiente de teste, isConfigured() é false → fallback
// localStorage. Cobrimos o caminho offline-first.
describe('savedPrompts — fallback localStorage', () => {
  beforeEach(() => localStorage.clear());

  it('rejeita conteúdo vazio', async () => {
    const res = await savePrompt({ template: 't', content: '   ' });
    expect(res.ok).toBe(false);
    expect(res.error).toBe('empty');
  });

  it('salva localmente e lista (mais recente primeiro)', async () => {
    expect((await savePrompt({ template: 'a', content: 'primeiro' })).where).toBe('local');
    await savePrompt({ template: 'b', content: 'segundo' });
    const list = await listSavedPrompts();
    expect(list).toHaveLength(2);
    expect(list[0].content).toBe('segundo');
    expect(list[1].template).toBe('a');
  });

  it('remove pelo ts no fallback local', async () => {
    await savePrompt({ template: 'a', content: 'x' });
    const [item] = await listSavedPrompts();
    await deleteSavedPrompt(item.ts);
    expect(await listSavedPrompts()).toHaveLength(0);
  });
});
