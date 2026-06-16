// resultPanel.js — painel de resultado do prompt (Fase 3), compartilhado entre
// generator.html e index.html. Renderiza as ações: Copiar · Editar · Salvar ·
// Abrir na IA (+ Exportar .md / Limpar). Os builders de URL são funções puras,
// testáveis isoladamente.

import { copyText } from './common.js';
import { t } from './i18n.js';
import { track } from './telemetry.js';
import { addPromptToHistory } from './promptHistory.js';
import { openSaveDialog } from './saveDialog.js';

// ─── Builders de URL para abrir o prompt na IA (puros) ───
// Prefill é best-effort: ChatGPT e Claude honram ?q=; Gemini não tem parâmetro
// público confiável → abrimos o app e copiamos o prompt para o clipboard como
// rede de segurança (também usada para prompts longos que estouram a URL).
export function aiUrl(provider, prompt) {
  const q = encodeURIComponent(String(prompt || ''));
  switch (provider) {
    case 'chatgpt':
      return `https://chatgpt.com/?q=${q}`;
    case 'claude':
      return `https://claude.ai/new?q=${q}`;
    case 'gemini':
      return 'https://gemini.google.com/app';
    default:
      return '';
  }
}

export const AI_PROVIDERS = [
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'claude', label: 'Claude' },
  { id: 'gemini', label: 'Gemini' },
];

function esc(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}

// Renderiza o painel dentro de `container`, para o prompt `prompt` do template
// `id` (com `title` opcional para export/salvar). Mantém as classes visuais
// existentes (output-header/box/content, btn-copy/btn-clear).
// `skipHistory`: não registra no histórico efêmero (usado ao abrir da Biblioteca).
export function renderResultPanel(container, { id, prompt, title, skipHistory, analysis } = {}) {
  if (!container) return;
  const state = { text: String(prompt || ''), editing: false };
  const aiOptions = AI_PROVIDERS.map(
    (p) => `<button type="button" role="menuitem" data-ai="${p.id}">${esc(p.label)}</button>`,
  ).join('');

  const scoreChipHtml = analysis ? buildScoreChipHtml(analysis) : '';

  container.innerHTML = `
    <div class="output-header">
      <h3>&#x2705; <span data-i18n="result.title">${esc(t('result.title'))}</span>${scoreChipHtml}</h3>
      <div class="btn-row result-actions" style="margin-top:0;">
        <button type="button" class="btn-copy" data-act="copy">&#x1f4cb; <span data-i18n="result.copy">${esc(t('result.copy'))}</span></button>
        <button type="button" class="btn-copy" data-act="edit" aria-pressed="false">&#x270f;&#xfe0f; <span data-i18n="result.edit">${esc(t('result.edit'))}</span></button>
        <button type="button" class="btn-copy" data-act="save">&#x1f4be; <span data-i18n="result.save">${esc(t('result.save'))}</span></button>
        <div class="ai-open">
          <button type="button" class="btn-copy" data-act="ai-toggle" aria-haspopup="true" aria-expanded="false">&#x1f916; <span data-i18n="result.openai">${esc(t('result.openai'))}</span> &#x25be;</button>
          <div class="ai-menu" role="menu" hidden>${aiOptions}</div>
        </div>
        <button type="button" class="btn-copy" data-act="export">&#x2b07; <span data-i18n="result.export">${esc(t('result.export'))}</span></button>
        <button type="button" class="btn-clear" data-act="clear">&#x2716; <span data-i18n="result.clear">${esc(t('result.clear'))}</span></button>
      </div>
    </div>
    <div class="output-box">
      <div class="output-content" data-role="text"></div>
      <textarea class="output-edit" data-role="edit" hidden aria-label="${esc(t('result.edit'))}"></textarea>
    </div>
  `;

  const textEl = container.querySelector('[data-role="text"]');
  const editEl = container.querySelector('[data-role="edit"]');
  textEl.textContent = state.text;

  const currentText = () => (state.editing ? editEl.value : state.text);

  const setEditing = (on) => {
    state.editing = on;
    if (on) {
      editEl.value = state.text;
      editEl.hidden = false;
      textEl.hidden = true;
      editEl.focus();
    } else {
      state.text = editEl.value;
      textEl.textContent = state.text;
      editEl.hidden = true;
      textEl.hidden = false;
    }
    const btn = container.querySelector('[data-act="edit"]');
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.toggle('on', on);
  };

  const aiMenu = container.querySelector('.ai-menu');
  const aiToggle = container.querySelector('[data-act="ai-toggle"]');
  const closeAiMenu = () => {
    aiMenu.hidden = true;
    aiToggle.setAttribute('aria-expanded', 'false');
  };
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) closeAiMenu();
  });

  container.addEventListener('click', async (e) => {
    const actBtn = e.target.closest('[data-act]');
    const aiBtn = e.target.closest('[data-ai]');

    if (aiBtn) {
      const provider = aiBtn.dataset.ai;
      // Sempre copia (rede de segurança p/ prompts longos / Gemini sem prefill).
      await copyText(currentText());
      window.open(aiUrl(provider, currentText()), '_blank', 'noopener');
      track('open_in_ai', { provider, template: id });
      closeAiMenu();
      return;
    }
    if (!actBtn) return;

    switch (actBtn.dataset.act) {
      case 'copy':
        copyText(currentText());
        break;
      case 'edit':
        setEditing(!state.editing);
        break;
      case 'save': {
        openSaveDialog({ template: id, content: currentText(), defaultTitle: title });
        break;
      }
      case 'ai-toggle': {
        const open = aiMenu.hidden;
        aiMenu.hidden = !open;
        aiToggle.setAttribute('aria-expanded', String(open));
        break;
      }
      case 'export':
        exportMd(id, title, currentText());
        break;
      case 'clear':
        container.classList.remove('visible');
        container.innerHTML = '';
        break;
    }
  });

  // histórico local (#M14): registra o prompt gerado. Pula ao reabrir da Biblioteca.
  if (!skipHistory) addPromptToHistory(id, state.text);
  return { getText: currentText };
}

function gradeColor(grade) {
  if (grade === 'Forte' || grade === 'Strong') return 'var(--accent)';
  if (grade === 'Bom' || grade === 'Good') return 'oklch(0.8 0.13 80)';
  if (grade === 'Fraco' || grade === 'Weak') return 'oklch(0.66 0.19 28)';
  return 'var(--text-3)';
}

function buildScoreChipHtml(analysis) {
  if (!analysis) return '';
  const { score, grade } = analysis;
  const size = 28;
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - (score || 0) / 100);
  const col = gradeColor(grade);
  const displayScore = grade === '—' ? '–' : score;
  return `
    <span class="score-chip" title="${esc(t('quality.chip.title'))}">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true" style="flex-shrink:0">
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--line-2,#333)" stroke-width="3"/>
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${col}" stroke-width="3"
          stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}"
          transform="rotate(-90 ${size / 2} ${size / 2})"
          style="transition:stroke-dashoffset .4s ease,stroke .3s"/>
        <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle"
          style="font-size:${size * 0.3}px;font-weight:700;fill:var(--text);font-family:var(--font-mono,monospace)">${displayScore}</text>
      </svg>
      <span style="color:${col};font-weight:600;font-size:13px">${esc(grade)}</span>
    </span>`;
}

function exportMd(id, title, text) {
  const md = `# ${title || id}\n\n\`\`\`\n${text}\n\`\`\`\n`;
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prompt-${id}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  track('export_md', { template: id });
}
