import { aiUrl, AI_PROVIDERS, renderResultPanel } from '../assets/js/resultPanel.js';

describe('resultPanel — builders de URL de IA', () => {
  const prompt = 'Revise este código & corrija bugs';

  it('ChatGPT usa ?q= com prompt codificado', () => {
    const url = aiUrl('chatgpt', prompt);
    expect(url.startsWith('https://chatgpt.com/?q=')).toBe(true);
    expect(url).toContain(encodeURIComponent(prompt));
  });

  it('Claude usa /new?q= com prompt codificado', () => {
    const url = aiUrl('claude', prompt);
    expect(url.startsWith('https://claude.ai/new?q=')).toBe(true);
    expect(url).toContain(encodeURIComponent(prompt));
  });

  it('Gemini abre o app (sem prefill confiável)', () => {
    expect(aiUrl('gemini', prompt)).toBe('https://gemini.google.com/app');
  });

  it('provider desconhecido retorna string vazia', () => {
    expect(aiUrl('foo', prompt)).toBe('');
  });

  it('expõe os 3 provedores', () => {
    expect(AI_PROVIDERS.map((p) => p.id)).toEqual(['chatgpt', 'claude', 'gemini']);
  });
});

describe('resultPanel — renderResultPanel', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="out"></div>';
    localStorage.clear();
    navigator.clipboard = { writeText: () => Promise.resolve() };
  });

  it('renderiza as 4 ações principais + exportar/limpar', () => {
    const c = document.getElementById('out');
    renderResultPanel(c, { id: 'revisao-correcao', prompt: 'meu prompt', title: 'Revisão' });
    const acts = [...c.querySelectorAll('[data-act]')].map((b) => b.dataset.act);
    expect(acts).toEqual(expect.arrayContaining(['copy', 'edit', 'save', 'ai-toggle', 'export', 'clear']));
    expect(c.querySelector('[data-role="text"]').textContent).toBe('meu prompt');
    expect(c.querySelectorAll('.ai-menu [data-ai]')).toHaveLength(3);
  });

  it('Editar alterna para textarea e o texto editado é preservado', () => {
    const c = document.getElementById('out');
    renderResultPanel(c, { id: 't', prompt: 'original' });
    c.querySelector('[data-act="edit"]').click();
    const ta = c.querySelector('[data-role="edit"]');
    expect(ta.hidden).toBe(false);
    expect(ta.value).toBe('original');
    ta.value = 'editado';
    c.querySelector('[data-act="edit"]').click(); // commit
    expect(c.querySelector('[data-role="text"]').textContent).toBe('editado');
  });

  it('Abrir na IA copia e abre a URL do provedor', async () => {
    const c = document.getElementById('out');
    let opened = null;
    window.open = (url) => { opened = url; return null; };
    renderResultPanel(c, { id: 't', prompt: 'p' });
    c.querySelector('[data-act="ai-toggle"]').click();
    c.querySelector('[data-ai="claude"]').click();
    await new Promise((r) => setTimeout(r, 0));
    expect(opened.startsWith('https://claude.ai/new?q=')).toBe(true);
  });

  it('Salvar (offline) grava no localStorage', async () => {
    const c = document.getElementById('out');
    renderResultPanel(c, { id: 'tpl', prompt: 'para salvar' });
    c.querySelector('[data-act="save"]').click();
    await new Promise((r) => setTimeout(r, 0));
    const saved = JSON.parse(localStorage.getItem('pe:saved-prompts') || '[]');
    expect(saved[0].content).toBe('para salvar');
    expect(saved[0].template).toBe('tpl');
  });
});
