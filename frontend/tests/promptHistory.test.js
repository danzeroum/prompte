import {
  getPromptHistory,
  addPromptToHistory,
  clearPromptHistory,
} from '../assets/js/promptHistory.js';

describe('promptHistory (#M14)', () => {
  beforeEach(() => localStorage.clear());

  it('começa vazio', () => {
    expect(getPromptHistory()).toEqual([]);
  });

  it('adiciona prompts (mais recente primeiro) e ignora vazios', () => {
    addPromptToHistory('review', 'primeiro');
    addPromptToHistory('api', '   ');
    addPromptToHistory('debug-erros', 'segundo');
    const h = getPromptHistory();
    expect(h).toHaveLength(2);
    expect(h[0]).toMatchObject({ template: 'debug-erros', content: 'segundo' });
    expect(h[1]).toMatchObject({ template: 'review', content: 'primeiro' });
    expect(h[0].ts).toBeTruthy();
  });

  it('mantém no máximo 20 itens', () => {
    for (let i = 0; i < 25; i++) addPromptToHistory('t', 'p' + i);
    const h = getPromptHistory();
    expect(h).toHaveLength(20);
    expect(h[0].content).toBe('p24');
  });

  it('clear remove tudo', () => {
    addPromptToHistory('t', 'x');
    clearPromptHistory();
    expect(getPromptHistory()).toEqual([]);
  });

  it('tolera dados corrompidos', () => {
    localStorage.setItem('pe-prompt-history', '{bad');
    expect(getPromptHistory()).toEqual([]);
  });
});
