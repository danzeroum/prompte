// app.js — ponto de entrada (módulo ES) carregado por cada página.
// Inicializa tema, i18n, acessibilidade da navegação, controles de topbar e
// telemetria, sem interferir na lógica inline existente de cada HTML.

import { initTheme } from './theme.js';
import { initI18n, t } from './i18n.js';
import {
  enhanceNavigation,
  injectTopbarControls,
  copyText,
  injectOfflineBanner,
} from './common.js';
import { track, flush } from './telemetry.js';
import { buildPrompt, generatorTemplates, collectFormData } from './generators.js';
import { askLLM } from './llmClient.js';
import { initAuth } from './auth.js';
import { initChat } from './chat.js';
import { isConfigured } from './supabaseClient.js';

function mountManualPlayground() {
  const host = document.getElementById('pe-playground');
  if (!host) return;

  // Apenas os exemplos marcados como playground entram no seletor do manual;
  // os 25 templates do gerador têm campos próprios e não se aplicam aqui.
  const keys = Object.keys(generatorTemplates).filter((k) => generatorTemplates[k].playground);
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
  // #M12: adia o carregamento do SDK do Supabase. initAuth() (que importa o SDK)
  // só roda no load quando há um retorno de magic link na URL; caso contrário é
  // acionado sob demanda (abrir login/chat) via window.PE.ensureAuth.
  if (
    /(access_token|refresh_token|[?&]code=|error_description)/.test(location.hash + location.search)
  ) {
    initAuth();
  }
  initChat();
  mountManualPlayground();

  // Degradação graciosa (#M8): sem backend configurado, avisa o usuário. A
  // geração de prompts pelos templates segue funcionando (é 100% client-side).
  if (!isConfigured()) injectOfflineBanner();

  track('pageview', { path: location.pathname });

  // Envia a fila de telemetria: no load, periodicamente e ao sair da página.
  flush();
  setInterval(flush, 30000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });

  // exposto para depuração/uso futuro por scripts inline das páginas
  // (generator.html usa buildPrompt + generatorTemplates para o dispatch).
  // ensureAuth (#M12): inicializa a auth sob demanda quando o usuário abre o
  // login/chat, evitando carregar o SDK no load para quem nunca os usa.
  window.PE = {
    copyText,
    buildPrompt,
    generatorTemplates,
    collectFormData,
    track,
    flush,
    askLLM,
    ensureAuth: initAuth,
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
