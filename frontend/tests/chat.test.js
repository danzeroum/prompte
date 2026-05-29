import { jest } from '@jest/globals';

// chat.js importa llmClient/telemetry/i18n; mockamos os de rede para isolar a UI.
jest.unstable_mockModule('../assets/js/llmClient.js', () => ({ askLLM: jest.fn() }));
jest.unstable_mockModule('../assets/js/telemetry.js', () => ({ track: jest.fn() }));

const { buildMessages, initChat, loadHistory, saveHistory } = await import('../assets/js/chat.js');

describe('buildMessages', () => {
  it('prefixa o system prompt e anexa a mensagem do usuário', () => {
    const msgs = buildMessages([], 'oi', 'SYS');
    expect(msgs[0]).toEqual({ role: 'system', content: 'SYS' });
    expect(msgs[msgs.length - 1]).toEqual({ role: 'user', content: 'oi' });
  });

  it('inclui o histórico entre o system e a nova mensagem', () => {
    const history = [
      { role: 'user', content: 'a' },
      { role: 'assistant', content: 'b' },
    ];
    const msgs = buildMessages(history, 'c', 'SYS');
    expect(msgs.map((m) => m.content)).toEqual(['SYS', 'a', 'b', 'c']);
  });
});

describe('persistência do histórico (#M5)', () => {
  beforeEach(() => localStorage.clear());

  it('saveHistory grava e loadHistory restaura as mensagens', () => {
    const history = [
      { role: 'user', content: 'oi' },
      { role: 'assistant', content: 'olá' },
    ];
    saveHistory(history);
    expect(loadHistory()).toEqual(history);
  });

  it('loadHistory ignora dados inválidos', () => {
    localStorage.setItem('pe-chat-history', '{not json');
    expect(loadHistory()).toEqual([]);
    localStorage.setItem('pe-chat-history', JSON.stringify([{ role: 'x' }, null, { role: 'user', content: 'ok' }]));
    expect(loadHistory()).toEqual([{ role: 'user', content: 'ok' }]);
  });
});

describe('initChat', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  it('injeta o FAB e o painel (oculto) uma única vez', () => {
    initChat();
    initChat(); // idempotente
    expect(document.querySelectorAll('.pe-chat-fab')).toHaveLength(1);
    const panel = document.querySelector('.pe-chat-panel');
    expect(panel).not.toBeNull();
    expect(panel.hidden).toBe(true);
  });

  it('inclui a barra de sugestão de ebooks (#KB), oculta por padrão', () => {
    initChat();
    const suggest = document.querySelector('.pe-chat-suggest');
    expect(suggest).not.toBeNull();
    expect(suggest.hidden).toBe(true);
    // fica entre o log e o formulário, dentro do painel.
    const panel = document.querySelector('.pe-chat-panel');
    expect(panel.contains(suggest)).toBe(true);
  });

  it('abre o painel ao clicar no FAB e mostra a saudação', () => {
    initChat();
    document.querySelector('.pe-chat-fab').click();
    expect(document.querySelector('.pe-chat-panel').hidden).toBe(false);
    expect(document.querySelector('.pe-chat-assistant')).not.toBeNull();
  });

  it('restaura o histórico salvo ao abrir, sem mostrar a saudação', () => {
    saveHistory([
      { role: 'user', content: 'pergunta antiga' },
      { role: 'assistant', content: 'resposta antiga' },
    ]);
    initChat();
    document.querySelector('.pe-chat-fab').click();
    const msgs = document.querySelectorAll('.pe-chat-msg');
    expect(msgs).toHaveLength(2);
    expect(msgs[0].textContent).toBe('pergunta antiga');
    expect(msgs[1].textContent).toBe('resposta antiga');
  });
});
