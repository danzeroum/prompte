import { jest } from '@jest/globals';

// chat.js importa llmClient/telemetry/i18n; mockamos os de rede para isolar a UI.
jest.unstable_mockModule('../assets/js/llmClient.js', () => ({ askLLM: jest.fn() }));
jest.unstable_mockModule('../assets/js/telemetry.js', () => ({ track: jest.fn() }));

const { buildMessages, initChat } = await import('../assets/js/chat.js');

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

describe('initChat', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('injeta o FAB e o painel (oculto) uma única vez', () => {
    initChat();
    initChat(); // idempotente
    expect(document.querySelectorAll('.pe-chat-fab')).toHaveLength(1);
    const panel = document.querySelector('.pe-chat-panel');
    expect(panel).not.toBeNull();
    expect(panel.hidden).toBe(true);
  });

  it('abre o painel ao clicar no FAB e mostra a saudação', () => {
    initChat();
    document.querySelector('.pe-chat-fab').click();
    expect(document.querySelector('.pe-chat-panel').hidden).toBe(false);
    expect(document.querySelector('.pe-chat-assistant')).not.toBeNull();
  });
});
