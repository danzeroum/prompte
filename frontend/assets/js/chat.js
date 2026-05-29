// chat.js — widget de chat flutuante do assistente conversacional.
// Injeta um botão (FAB) e um painel nas páginas; envia o histórico para
// window-level `askLLM` (Edge Function `prompt-llm`) e renderiza as respostas.

import { askLLM } from './llmClient.js';
import { track } from './telemetry.js';
import { t } from './i18n.js';

const SYSTEM_PROMPT =
  'Você é um assistente de engenharia de prompts. Faça perguntas objetivas para ' +
  'entender o objetivo do usuário (repositório, arquivo, contexto, restrições) e, ' +
  'quando tiver o suficiente, produza um PROMPT final pronto para colar em uma IA, ' +
  'delimitado por uma linha "=== PROMPT ===". Responda no idioma do usuário.';

// Helper puro/testável: monta o array enviado à LLM a partir do histórico.
export function buildMessages(history, userText, system = SYSTEM_PROMPT) {
  const base = [{ role: 'system', content: system }];
  const past = history.map((m) => ({ role: m.role, content: m.content }));
  return [...base, ...past, { role: 'user', content: userText }];
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function initChat(root = document) {
  const body = root.body || document.body;
  if (!body || body.querySelector('.pe-chat-fab')) return;

  const history = []; // { role: 'user'|'assistant', content }

  // Botão flutuante
  const fab = el('button', 'pe-chat-fab');
  fab.type = 'button';
  fab.setAttribute('aria-label', t('chat.open'));
  fab.title = t('chat.open');
  fab.textContent = '💬';

  // Painel
  const panel = el('div', 'pe-chat-panel');
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', t('chat.title'));

  const header = el('div', 'pe-chat-header');
  header.append(el('span', null, t('chat.title')));
  const closeBtn = el('button', 'pe-chat-close', '✕');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', t('chat.close'));
  header.append(closeBtn);

  const log = el('div', 'pe-chat-log');
  log.setAttribute('aria-live', 'polite');

  const form = el('form', 'pe-chat-form');
  const input = el('input', 'pe-chat-input');
  input.type = 'text';
  input.placeholder = t('chat.placeholder');
  input.setAttribute('aria-label', t('chat.placeholder'));
  const send = el('button', 'pe-chat-send', t('chat.send'));
  send.type = 'submit';
  form.append(input, send);

  panel.append(header, log, form);

  function addBubble(role, content, extraClass) {
    const b = el('div', `pe-chat-msg pe-chat-${role}${extraClass ? ' ' + extraClass : ''}`);
    b.textContent = content;
    log.append(b);
    log.scrollTop = log.scrollHeight;
    return b;
  }

  function openPanel(open) {
    panel.hidden = !open;
    fab.setAttribute('aria-expanded', String(open));
    if (open) {
      if (!history.length) addBubble('assistant', t('chat.greeting'));
      input.focus();
    }
  }

  fab.addEventListener('click', () => openPanel(panel.hidden));
  closeBtn.addEventListener('click', () => openPanel(false));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addBubble('user', text);
    const payload = buildMessages(history, text);
    history.push({ role: 'user', content: text });

    send.disabled = true;
    const thinking = addBubble('assistant', t('chat.thinking'), 'pe-chat-thinking');
    try {
      const res = await askLLM(payload, 0.3);
      thinking.remove();
      const content = res?.content || '';
      addBubble('assistant', content);
      history.push({ role: 'assistant', content });
      track('chat_message', { cache_hit: Boolean(res?.cache_hit) });
    } catch (err) {
      thinking.remove();
      const msg = err?.rateLimited
        ? t('chat.rateLimited')
        : `${t('chat.error')} ${err?.message ? '(' + err.message + ')' : ''}`.trim();
      addBubble('assistant', msg, 'pe-chat-err');
    } finally {
      send.disabled = false;
      input.focus();
    }
  });

  body.append(fab, panel);
}
