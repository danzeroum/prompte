// app.js — ponto de entrada (módulo ES) carregado por cada página.
// Inicializa tema, i18n, acessibilidade da navegação, controles de topbar e
// telemetria, sem interferir na lógica inline existente de cada HTML.

import { initTheme } from './theme.js';
import { initI18n, t } from './i18n.js';
import { enhanceNavigation, injectTopbarControls, copyText } from './common.js';
import { track, flush } from './telemetry.js';
import { buildPrompt, generatorTemplates } from './generators.js';

function mountManualPlayground() {
  const host = document.getElementById('pe-playground');
  if (!host) return;

  const keys = Object.keys(generatorTemplates);
  const options = keys
    .map((k) => `<option value="${k}">${generatorTemplates[k].name}</option>`)
    .join('');

  host.classList.add('pe-playground');
  host.innerHTML = `
    <h3 data-i18n="playground.title">${t('playground.title')}</h3>
    <label for="pe-pg-gen">Gerador</label>
    <select id="pe-pg-gen">${options}</select>
    <label for="pe-pg-repo">Repositório</label>
    <input id="pe-pg-repo" placeholder="/meu/projeto" value="/meu/projeto">
    <label for="pe-pg-file">Arquivo / Recurso</label>
    <input id="pe-pg-file" placeholder="auth.ts" value="auth.ts">
    <label for="pe-pg-ctx">Contexto</label>
    <input id="pe-pg-ctx" placeholder="Revisão antes de produção" value="Revisão antes de produção">
    <button type="button" class="pe-btn" id="pe-pg-run" data-i18n="playground.run">${t('playground.run')}</button>
    <pre id="pe-pg-out" hidden></pre>
  `;

  host.querySelector('#pe-pg-run').addEventListener('click', () => {
    const key = host.querySelector('#pe-pg-gen').value;
    const repo = host.querySelector('#pe-pg-repo').value;
    const file = host.querySelector('#pe-pg-file').value;
    const contexto = host.querySelector('#pe-pg-ctx').value;
    const data =
      key === 'api'
        ? { recurso: file, framework: 'Express', contexto }
        : { repo, arquivo: file, contexto };
    const out = host.querySelector('#pe-pg-out');
    out.textContent = buildPrompt(key, data);
    out.hidden = false;
    track('playground_generate', { template: key });
  });
}

function init() {
  initTheme();
  initI18n();
  enhanceNavigation();
  injectTopbarControls();
  mountManualPlayground();
  track('pageview', { path: location.pathname });

  // Envia a fila de telemetria: no load, periodicamente e ao sair da página.
  flush();
  setInterval(flush, 30000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });

  // exposto para depuração/uso futuro por scripts inline das páginas
  window.PE = { copyText, buildPrompt, track, flush };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
