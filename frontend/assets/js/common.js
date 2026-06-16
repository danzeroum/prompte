// common.js — comportamentos compartilhados aplicados de forma NÃO invasiva
// sobre o HTML existente das três páginas: acessibilidade da navegação,
// controles de topbar (tema + preferências) e utilitário de cópia.
// A lógica de navegação/geração específica de cada página permanece
// nos seus <script> inline; aqui apenas a enriquecemos.

import { toggleTheme, currentTheme } from './theme.js';
import { setLang, getLang, t } from './i18n.js';
import {
  getPreferences,
  setPreference,
  exportPreferences,
  importPreferences,
} from './preferences.js';
import { showToast } from './validation.js';
import { onAuthChange, signInWithEmail, signOut, currentUser } from './auth.js';
import { getPromptHistory, clearPromptHistory } from './promptHistory.js';

const NAV_SELECTOR = '.sb-item, .sidebar-item';

// ---- Degradação graciosa (#M8) ----
// Banner dismissível exibido quando o backend (Supabase) não está configurado.
// NÃO desabilita a geração local de prompts pelos templates — apenas avisa que
// os recursos de rede (chat e respostas com IA) estão indisponíveis.
export function injectOfflineBanner(root = document) {
  const body = root.body || document.body;
  if (!body || body.querySelector('.pe-offline-banner')) return null;

  const banner = document.createElement('div');
  banner.className = 'pe-offline-banner';
  banner.setAttribute('role', 'status');

  const text = document.createElement('div');
  text.className = 'pe-offline-text';
  const strong = document.createElement('strong');
  strong.textContent = t('banner.offline.title');
  const span = document.createElement('span');
  span.textContent = ' ' + t('banner.offline.body');
  text.append(strong, span);

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'pe-offline-close';
  close.textContent = '✕';
  close.setAttribute('aria-label', t('banner.dismiss'));
  close.title = t('banner.dismiss');
  close.addEventListener('click', () => banner.remove());

  banner.append(text, close);
  body.prepend(banner);
  return banner;
}

// ---- Atalhos de teclado (#M13) ----
// Ctrl/Cmd+Enter gera o prompt do painel ativo; Escape fecha overlays (chat,
// modal de login). Não interfere na digitação normal nos campos.
export function initKeyboardShortcuts(root = document) {
  root.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const btn =
        root.querySelector('.template-panel.active .btn-generate') ||
        root.querySelector('.btn-generate');
      if (btn) {
        e.preventDefault();
        btn.click();
      }
      return;
    }
    if (e.key === 'Escape') {
      const panel = root.querySelector('.pe-chat-panel');
      if (panel && !panel.hidden) {
        panel.hidden = true;
        return;
      }
      const modal = root.querySelector('.pe-modal-overlay:not([hidden])');
      if (modal) modal.hidden = true;
    }
  });
}

// ---- Acessibilidade da navegação ----
export function enhanceNavigation(root = document) {
  const items = root.querySelectorAll(NAV_SELECTOR);
  items.forEach((el) => {
    // <a>/<button> já são acessíveis por teclado; só tratamos <div> clicáveis.
    const native = el.tagName === 'A' || el.tagName === 'BUTTON';
    if (native) return;
    if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        el.click();
      }
    });
  });

  // Sincroniza aria-current="page" com a classe .active definida pelas páginas.
  const sidebars = root.querySelectorAll('.sidebar');
  const sync = () => {
    items.forEach((el) =>
      el.classList.contains('active')
        ? el.setAttribute('aria-current', 'page')
        : el.removeAttribute('aria-current'),
    );
  };
  sidebars.forEach((sb) =>
    new MutationObserver(sync).observe(sb, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    }),
  );
  sync();
}

// ---- Utilitário de cópia (usado por novos componentes, ex.: playground) ----
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(t('toast.copied.title'), t('toast.copied.body'), 'success');
    return true;
  } catch {
    showToast(t('toast.copyError.title'), t('toast.copyError.body'), 'error');
    return false;
  }
}

// ---- Controles de topbar (tema + preferências) ----
// Define/atualiza o emoji do botão dentro de um <span aria-hidden> para que o
// leitor de tela anuncie só o aria-label, não o nome do emoji (#M-UX7).
function setIconEmoji(btn, emoji) {
  let span = btn.querySelector('.pe-emoji');
  if (!span) {
    span = document.createElement('span');
    span.className = 'pe-emoji';
    span.setAttribute('aria-hidden', 'true');
    btn.textContent = '';
    btn.appendChild(span);
  }
  span.textContent = emoji;
}

function buildIconButton(label, emoji, onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'pe-icon-btn';
  btn.setAttribute('aria-label', label);
  btn.title = label;
  setIconEmoji(btn, emoji);
  btn.addEventListener('click', onClick);
  return btn;
}

// Aprisiona o foco dentro de um modal e devolve um "destrutor" (#M-UX7).
// Tab/Shift+Tab circulam entre os focáveis; Escape chama onEscape se fornecido.
export function trapFocus(container, onEscape) {
  const SEL =
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function handle(e) {
    if (e.key === 'Escape') {
      if (onEscape) {
        e.preventDefault();
        onEscape();
      }
      return;
    }
    if (e.key !== 'Tab') return;
    const items = Array.from(container.querySelectorAll(SEL));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
  container.addEventListener('keydown', handle);
  return () => container.removeEventListener('keydown', handle);
}

export function injectTopbarControls(root = document) {
  const topbar = root.querySelector('.topbar');
  if (!topbar || topbar.querySelector('.pe-topbar-controls')) return;

  // Nav primária: Início · Gerador · Biblioteca
  if (!topbar.querySelector('.pe-primary-nav')) {
    const nav = document.createElement('nav');
    nav.className = 'pe-primary-nav';
    nav.setAttribute('aria-label', t('nav.primary'));
    const links = [
      { href: '/index.html', label: t('nav.home'), paths: ['/', '/index.html'] },
      { href: '/generator.html', label: t('nav.generator'), paths: ['/generator.html'] },
      { href: '/library.html', label: t('nav.library'), paths: ['/library.html'] },
    ];
    const currentPath = location.pathname.replace(/\/$/, '') || '/index.html';
    links.forEach(({ href, label, paths }) => {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      a.className = 'pe-nav-link';
      const active = paths.some((p) => currentPath === p || (p === '/' && currentPath === ''));
      if (active) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
      nav.appendChild(a);
    });
    topbar.insertBefore(nav, topbar.firstChild);
  }

  const controls = document.createElement('div');
  controls.className = 'pe-topbar-controls';

  // Toggle de tema
  const themeBtn = buildIconButton(
    t('topbar.toggleTheme'),
    currentTheme() === 'light' ? '🌙' : '☀️',
    () => {
      const next = toggleTheme();
      setIconEmoji(themeBtn, next === 'light' ? '🌙' : '☀️');
    },
  );

  // Histórico de prompts (#M14)
  const historyBtn = buildIconButton(t('history.title'), '🕘', () => openHistoryModal());

  // Botão de preferências + menu
  const menu = buildPreferencesMenu(root);
  const settingsBtn = buildIconButton(t('topbar.settings'), '⚙️', () => {
    menu.hidden = !menu.hidden;
    settingsBtn.setAttribute('aria-expanded', String(!menu.hidden));
  });
  settingsBtn.setAttribute('aria-haspopup', 'true');
  settingsBtn.setAttribute('aria-expanded', 'false');

  controls.append(themeBtn, historyBtn, settingsBtn);
  topbar.appendChild(controls);
  root.body ? root.body.appendChild(menu) : document.body.appendChild(menu);

  // Fecha o menu ao clicar fora
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !menu.contains(e.target) && e.target !== settingsBtn) {
      menu.hidden = true;
      settingsBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

function buildPreferencesMenu() {
  const menu = document.createElement('div');
  menu.className = 'pe-menu';
  menu.hidden = true;

  // Aparência
  const appLabel = document.createElement('div');
  appLabel.className = 'pe-menu-label';
  appLabel.textContent = t('menu.appearance');
  const themeSelect = document.createElement('select');
  [
    ['system', t('menu.theme.system')],
    ['dark', t('menu.theme.dark')],
    ['light', t('menu.theme.light')],
  ].forEach(([val, label]) => {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = label;
    themeSelect.appendChild(opt);
  });
  themeSelect.value = getPreferences().theme || 'system';
  themeSelect.addEventListener('change', () => {
    const v = themeSelect.value;
    setPreference('theme', v === 'system' ? null : v);
    document.documentElement.classList.toggle('light-theme', v === 'light');
    if (v === 'system') {
      const sysLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      document.documentElement.classList.toggle('light-theme', sysLight);
    }
  });

  // Idioma
  const langLabel = document.createElement('div');
  langLabel.className = 'pe-menu-label';
  langLabel.textContent = t('menu.language');
  const langSelect = document.createElement('select');
  [
    ['pt', 'Português'],
    ['en', 'English'],
  ].forEach(([val, label]) => {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = label;
    langSelect.appendChild(opt);
  });
  langSelect.value = getLang();
  langSelect.addEventListener('change', () => setLang(langSelect.value));

  // Dados (export/import)
  const dataLabel = document.createElement('div');
  dataLabel.className = 'pe-menu-label';
  dataLabel.textContent = t('menu.data');

  const exportBtn = document.createElement('button');
  exportBtn.type = 'button';
  exportBtn.textContent = t('menu.export');
  exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(exportPreferences(), null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prompt-engineering-pro-prefs.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast(t('toast.exported.title'), '', 'success');
  });

  const importInput = document.createElement('input');
  importInput.type = 'file';
  importInput.accept = 'application/json';
  importInput.style.display = 'none';
  importInput.addEventListener('change', async () => {
    const file = importInput.files && importInput.files[0];
    if (!file) return;
    try {
      const prefs = importPreferences(JSON.parse(await file.text()));
      themeSelect.value = prefs.theme || 'system';
      langSelect.value = prefs.lang || 'pt';
      document.documentElement.classList.toggle('light-theme', prefs.theme === 'light');
      setLang(prefs.lang || 'pt');
      showToast(t('toast.imported.title'), '', 'success');
    } catch (err) {
      showToast(t('toast.importError.title'), String(err.message || err), 'error');
    }
    importInput.value = '';
  });
  const importBtn = document.createElement('button');
  importBtn.type = 'button';
  importBtn.textContent = t('menu.import');
  importBtn.addEventListener('click', () => importInput.click());

  // Conta (login via magic link — Fase D.2)
  const accountLabel = document.createElement('div');
  accountLabel.className = 'pe-menu-label';
  accountLabel.textContent = t('menu.account');
  const accountBtn = document.createElement('button');
  accountBtn.type = 'button';
  accountBtn.addEventListener('click', () => {
    if (currentUser()) {
      signOut().then(() => showToast(t('auth.signedOut'), '', 'info'));
    } else {
      openAuthModal();
    }
  });
  // Reflete o estado de autenticação no rótulo do botão.
  onAuthChange((user) => {
    accountBtn.textContent = user
      ? `${t('menu.signout')} (${user.email || 'conta'})`
      : t('menu.signin');
  });

  menu.append(
    appLabel,
    themeSelect,
    langLabel,
    langSelect,
    dataLabel,
    exportBtn,
    importBtn,
    importInput,
    accountLabel,
    accountBtn,
  );
  return menu;
}

// ---- Modal de histórico de prompts (#M14) ----
let _historyModal = null;
let _historyTrap = null;
let _historyReturnFocus = null;
function openHistoryModal() {
  if (_historyModal) _historyModal.remove();
  _historyReturnFocus =
    document.activeElement && document.activeElement.focus ? document.activeElement : null;
  _historyModal = buildHistoryModal();
  document.body.appendChild(_historyModal);
  _historyModal.hidden = false;
  _historyTrap = trapFocus(_historyModal, closeHistoryModal);
  const firstBtn = _historyModal.querySelector('button');
  if (firstBtn) firstBtn.focus();
}

// Fecha o histórico e devolve o foco ao gatilho que o abriu (#M-UX7).
function closeHistoryModal() {
  if (_historyTrap) {
    _historyTrap();
    _historyTrap = null;
  }
  if (_historyModal) {
    _historyModal.remove();
    _historyModal = null;
  }
  if (_historyReturnFocus) {
    _historyReturnFocus.focus();
    _historyReturnFocus = null;
  }
}

function buildHistoryModal() {
  const overlay = document.createElement('div');
  overlay.className = 'pe-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', t('history.title'));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeHistoryModal();
  });

  const modal = document.createElement('div');
  modal.className = 'pe-modal pe-history-modal';

  const head = document.createElement('div');
  head.className = 'pe-history-head';
  const h = document.createElement('h2');
  h.textContent = t('history.title');
  const close = buildIconButton(t('auth.close'), '✕', () => closeHistoryModal());
  head.append(h, close);
  modal.append(head);

  const list = document.createElement('div');
  list.className = 'pe-history-list';
  const items = getPromptHistory();

  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'pe-history-empty';
    empty.textContent = t('history.empty');
    list.append(empty);
  } else {
    items.forEach((it) => {
      const row = document.createElement('div');
      row.className = 'pe-history-item';
      const meta = document.createElement('div');
      meta.className = 'pe-history-meta';
      const when = new Date(it.ts);
      meta.textContent = `${it.template} · ${isNaN(when) ? '' : when.toLocaleString()}`;
      const snippet = document.createElement('div');
      snippet.className = 'pe-history-snippet';
      snippet.textContent = it.content.slice(0, 160) + (it.content.length > 160 ? '…' : '');
      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'pe-btn';
      copyBtn.textContent = t('history.copy');
      copyBtn.addEventListener('click', () => copyText(it.content));
      row.append(meta, snippet, copyBtn);
      list.append(row);
    });
  }
  modal.append(list);

  // Footer com confirmação inline em dois passos para a ação destrutiva (#M-UX3,
  // Nielsen H3): o 1º clique pede confirmação; só o 2º apaga de fato.
  const footer = document.createElement('div');
  footer.className = 'pe-history-footer';

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'pe-btn';
  clearBtn.textContent = t('history.clear');
  clearBtn.disabled = !items.length;

  function renderConfirm() {
    footer.textContent = '';
    const msg = document.createElement('span');
    msg.className = 'pe-history-confirm-msg';
    msg.setAttribute('role', 'alert');
    msg.textContent = t('history.clear.q').replace('{n}', String(items.length));

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'pe-btn pe-btn-danger';
    confirmBtn.textContent = t('history.clear.confirm');
    confirmBtn.addEventListener('click', () => {
      clearPromptHistory();
      showToast(t('history.clear.done'), '', 'success');
      closeHistoryModal();
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'pe-btn-secondary';
    cancelBtn.textContent = t('history.clear.cancel');
    cancelBtn.addEventListener('click', renderClear);

    footer.append(msg, cancelBtn, confirmBtn);
    confirmBtn.focus();
  }

  function renderClear() {
    footer.textContent = '';
    footer.append(clearBtn);
    clearBtn.focus();
  }

  clearBtn.addEventListener('click', renderConfirm);
  footer.append(clearBtn);
  modal.append(footer);

  overlay.append(modal);
  return overlay;
}

// ---- Modal de login (magic link) ----
let _authModal = null;
let _authTrap = null;
let _authReturnFocus = null;
function openAuthModal() {
  // #M12: inicializa a auth sob demanda (carrega o SDK só agora) e detecta
  // sessão persistida de quem volta logado.
  if (typeof window !== 'undefined' && window.PE && window.PE.ensureAuth) window.PE.ensureAuth();
  if (!_authModal) _authModal = buildAuthModal();
  _authReturnFocus =
    document.activeElement && document.activeElement.focus ? document.activeElement : null;
  _authModal.hidden = false;
  _authTrap = trapFocus(_authModal, () => _authModal.querySelector('.pe-btn-secondary').click());
  const input = _authModal.querySelector('input');
  if (input) input.focus();
}

function buildAuthModal() {
  const overlay = document.createElement('div');
  overlay.className = 'pe-modal-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  // Fecha, libera o focus-trap e devolve o foco ao gatilho (#M-UX7).
  const close = () => {
    overlay.hidden = true;
    if (_authTrap) {
      _authTrap();
      _authTrap = null;
    }
    if (_authReturnFocus) {
      _authReturnFocus.focus();
      _authReturnFocus = null;
    }
  };

  const card = document.createElement('div');
  card.className = 'pe-modal';

  const title = document.createElement('h3');
  title.textContent = t('auth.title');
  const desc = document.createElement('p');
  desc.textContent = t('auth.desc');

  const input = document.createElement('input');
  input.type = 'email';
  input.autocomplete = 'email';
  input.placeholder = t('auth.emailPlaceholder');
  input.setAttribute('aria-label', t('auth.emailPlaceholder'));

  const send = document.createElement('button');
  send.type = 'button';
  send.className = 'pe-btn';
  send.textContent = t('auth.send');
  send.addEventListener('click', async () => {
    send.disabled = true;
    const res = await signInWithEmail(input.value);
    send.disabled = false;
    if (res.ok) {
      showToast(t('auth.sent'), '', 'success');
      close();
    } else {
      showToast(t('auth.error'), res.error || '', 'error');
    }
  });

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'pe-btn-secondary';
  closeBtn.textContent = t('auth.close');
  closeBtn.addEventListener('click', close);

  const actions = document.createElement('div');
  actions.className = 'pe-modal-actions';
  actions.append(send, closeBtn);

  card.append(title, desc, input, actions);
  overlay.append(card);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) close();
  });
  document.body.appendChild(overlay);
  return overlay;
}
