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
  initKeyboardShortcuts,
} from './common.js';
import { initCommandPalette } from './commandPalette.js';
import { initGlossary, bindGlossaryToI18n } from './glossary.js';
import { gateAdminLink } from './adminGate.js';
import { track, flush } from './telemetry.js';
import { buildPrompt, generatorTemplates, collectFormData } from './generators.js';
import { askLLM } from './llmClient.js';
import { initAuth } from './auth.js';
import { initChat } from './chat.js';
import { isConfigured } from './apiClient.js';
import { addPromptToHistory } from './promptHistory.js';
import { renderResultPanel } from './resultPanel.js';
import {
  listSavedPrompts,
  deleteSavedPrompt,
  updateSavedPrompt,
  listCollections,
  createCollection,
  renameCollection,
  deleteCollection,
} from './savedPrompts.js';
import { analyzePrompt, renderQualityFooter } from './promptQuality.js';
import { renderLibraryBanner } from './library.js';
import { initGithubFields, handleGithubCallbackParam } from './githubPicker.js';

// #KB: carregador lazy com cache do módulo da base de conhecimento. A promessa
// do import() é memoizada, então knowledgeBase.js é baixado e avaliado uma única
// vez, independentemente de quantas vezes o gerador enriquecer um prompt.
let _knowledgePromise;
function ensureKnowledge() {
  return (_knowledgePromise ??= import('./knowledgeBase.js'));
}

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
  initKeyboardShortcuts();
  initCommandPalette();
  // Gate do link Admin/Métricas: oculto por padrão, revelado só p/ admin (#M-UX-D).
  gateAdminLink();
  // Restaura a sessão (e-mail+senha) se houver token salvo. Leve: lê o
  // localStorage e valida via /api/auth/me. Idempotente; também acionável sob
  // demanda (abrir login/chat) via window.PE.ensureAuth.
  initAuth();
  initChat();
  mountManualPlayground();
  // Glossário inline (#M-UX6): roda após o i18n para não ser sobrescrito ao
  // aplicar as traduções nas descrições dos templates; re-renderiza ao trocar idioma.
  initGlossary();
  bindGlossaryToI18n();

  // Degradação graciosa (#M8): sem backend configurado, avisa o usuário. A
  // geração de prompts pelos templates segue funcionando (é 100% client-side).
  if (!isConfigured()) injectOfflineBanner();

  // Banner da Biblioteca na Home
  const libBannerHost = document.getElementById('lib-banner-host');
  if (libBannerHost) renderLibraryBanner(libBannerHost);

  // Conexão GitHub: aumenta os campos de caminho/repo no gerador com um seletor
  // de repositórios/arquivos e trata o retorno do OAuth (?github=...). Aditivo:
  // se não houver painéis de template, initGithubFields é no-op.
  initGithubFields();
  handleGithubCallbackParam();

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
    // #KB: base de conhecimento dos ebooks carregada sob demanda (mesmo padrão
    // lazy do #M12/ensureAuth). Importa knowledgeBase.js só quando o usuário
    // enriquece um prompt; o Vite gera um chunk separado fora do parse inicial.
    ensureKnowledge,
    addPromptToHistory,
    renderResultPanel,
    listSavedPrompts,
    deleteSavedPrompt,
    updateSavedPrompt,
    listCollections,
    createCollection,
    renameCollection,
    deleteCollection,
    analyzePrompt,
    renderQualityFooter,
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
