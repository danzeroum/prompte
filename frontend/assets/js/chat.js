// chat.js — widget de chat flutuante do assistente conversacional.
// Injeta um botão (FAB) e um painel nas páginas; envia o histórico para
// window-level `askLLM` (Edge Function `prompt-llm`) e renderiza as respostas.

import { askLLM } from './llmClient.js';
import { track } from './telemetry.js';
import { t } from './i18n.js';
import { isConfigured } from './supabaseClient.js';

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

// ─── Persistência do histórico (#M5) ───
const HISTORY_KEY = 'pe-chat-history';
const MAX_HISTORY = 50; // pares de mensagens guardados no localStorage

export function loadHistory() {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (m) => m && (m.role === 'user' || m.role === 'assistant') && m.content != null,
    );
  } catch {
    return [];
  }
}

export function saveHistory(history) {
  try {
    const trimmed = history.slice(-MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    /* sem storage: ignora */
  }
}

// #M7: atualiza `bubble` a cada segundo com o tempo restante até `resetAt`
// (ISO da Edge Function). Ao zerar, chama onDone() para reabilitar o envio.
function startCountdown(bubble, resetAt, onDone) {
  const target = new Date(resetAt).getTime();
  const render = () => {
    const remaining = Math.max(0, Math.ceil((target - Date.now()) / 1000));
    if (remaining <= 0) {
      clearInterval(timer);
      bubble.textContent = t('chat.rateLimited');
      onDone();
      return;
    }
    bubble.textContent = t('chat.rateLimitedCountdown').replace('{seconds}', String(remaining));
  };
  const timer = setInterval(render, 1000);
  render();
  return timer;
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

  const history = loadHistory(); // { role: 'user'|'assistant', content }, restaurado do localStorage

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

  // ─── #KB Fase 5: sugestão de conhecimento dos ebooks ───
  // Ao detectar um termo técnico digitado (ex.: "SOLID", "LGPD"), oferece anexar
  // a regra do ebook correspondente à próxima mensagem. knowledgeBase.js é
  // carregado sob demanda (lazy) só quando o usuário começa a digitar termos.
  const suggest = el('div', 'pe-chat-suggest');
  suggest.hidden = true;
  let kbMod = null;
  let kbLoading = false;
  let kbAccepted = false;
  let kbMatches = [];

  async function loadKB() {
    if (kbMod || kbLoading) return kbMod;
    kbLoading = true;
    try {
      kbMod =
        typeof window !== 'undefined' && window.PE && window.PE.ensureKnowledge
          ? await window.PE.ensureKnowledge()
          : await import('./knowledgeBase.js');
    } catch {
      kbMod = null;
    }
    kbLoading = false;
    return kbMod;
  }

  function resetSuggest() {
    kbMatches = [];
    kbAccepted = false;
    suggest.hidden = true;
    suggest.innerHTML = '';
  }

  function renderSuggest() {
    if (!kbMatches.length || !kbMod) {
      resetSuggest();
      return;
    }
    const labels = kbMatches.slice(0, 3).map((k) => kbMod.knowledgeDomains[k].label);
    suggest.hidden = false;
    suggest.innerHTML = '';
    suggest.append(
      el(
        'span',
        'pe-chat-suggest-text',
        t('chat.kb.suggest').replace('{terms}', labels.join(', ')),
      ),
    );
    const btn = el('button', 'pe-chat-suggest-btn');
    btn.type = 'button';
    const sync = () => {
      btn.textContent = kbAccepted ? t('chat.kb.added') : t('chat.kb.add');
      btn.setAttribute('aria-pressed', String(kbAccepted));
    };
    sync();
    btn.addEventListener('click', () => {
      kbAccepted = !kbAccepted;
      sync();
    });
    suggest.append(btn);
  }

  let kbTimer;
  input.addEventListener('input', () => {
    clearTimeout(kbTimer);
    kbTimer = setTimeout(async () => {
      const text = input.value.trim();
      if (text.length < 3) return resetSuggest();
      const mod = await loadKB();
      if (!mod) return;
      const next = mod.matchDomains(text);
      // Preserva o "aceito" se os termos não mudaram; senão, recomeça.
      if (next.join('|') !== kbMatches.join('|')) kbAccepted = false;
      kbMatches = next;
      renderSuggest();
    }, 350);
  });

  // #M8: sem backend, o chat (que depende de rede) fica desabilitado; o banner
  // de modo offline (injetado pelo app) explica a indisponibilidade.
  if (!isConfigured()) {
    input.disabled = true;
    send.disabled = true;
    input.placeholder = t('banner.offline.title');
  }

  panel.append(header, log, suggest, form);

  function addBubble(role, content, extraClass) {
    const b = el('div', `pe-chat-msg pe-chat-${role}${extraClass ? ' ' + extraClass : ''}`);
    b.textContent = content;
    log.append(b);
    log.scrollTop = log.scrollHeight;
    return b;
  }

  let firstOpen = true;
  function openPanel(open) {
    panel.hidden = !open;
    fab.setAttribute('aria-expanded', String(open));
    if (open) {
      // #M12: inicializa a auth sob demanda ao abrir o chat (usuário logado
      // ganha o limite maior de rate limiting).
      if (typeof window !== 'undefined' && window.PE && window.PE.ensureAuth)
        window.PE.ensureAuth();
      // Na primeira abertura, restaura o histórico salvo (#M5) ou saúda.
      if (firstOpen) {
        firstOpen = false;
        if (history.length) history.forEach((m) => addBubble(m.role, m.content));
        else addBubble('assistant', t('chat.greeting'));
      }
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
    // #KB Fase 5: se o usuário aceitou a sugestão, enriquece SÓ o que vai à LLM;
    // a bolha exibida e o histórico guardam o texto original do usuário.
    let outgoing = text;
    if (kbAccepted && kbMatches.length && kbMod) {
      outgoing = kbMod.appendKnowledge(text, { domains: kbMatches, level: 'intermediario' });
      track('knowledge_inject', { source: 'chat', domains: kbMatches });
    }
    resetSuggest();
    const payload = buildMessages(history, outgoing);
    history.push({ role: 'user', content: text });
    saveHistory(history);

    send.disabled = true;
    let cooling = false;
    const thinking = addBubble('assistant', t('chat.thinking'), 'pe-chat-thinking');
    try {
      const res = await askLLM(payload, 0.3);
      thinking.remove();
      const content = res?.content || '';
      addBubble('assistant', content);
      history.push({ role: 'assistant', content });
      saveHistory(history);
      track('chat_message', { cache_hit: Boolean(res?.cache_hit) });
    } catch (err) {
      thinking.remove();
      const resetAt = err?.resetAt;
      const validReset = resetAt && !Number.isNaN(new Date(resetAt).getTime());
      if (err?.rateLimited && validReset) {
        // #M7: mantém o envio desabilitado e mostra um countdown até o reset.
        cooling = true;
        const bubble = addBubble('assistant', '', 'pe-chat-err');
        startCountdown(bubble, resetAt, () => {
          send.disabled = false;
          input.focus();
        });
      } else {
        const msg = err?.rateLimited
          ? t('chat.rateLimited')
          : `${t('chat.error')} ${err?.message ? '(' + err.message + ')' : ''}`.trim();
        addBubble('assistant', msg, 'pe-chat-err');
      }
    } finally {
      send.disabled = cooling; // durante o cooldown o botão segue desabilitado
      if (!cooling) input.focus();
    }
  });

  body.append(fab, panel);
}
