// githubPicker.js — UI da conexão GitHub no gerador. Adiciona um botão discreto
// aos campos de caminho/repositório que abre um seletor: busca de repositórios e,
// para campos de arquivo, navegação na árvore do repo. Aditivo e não invasivo —
// o <input> de texto continua funcionando normalmente se o GitHub não for usado.
import { t } from './i18n.js';
import { showToast } from './validation.js';
import { trapFocus } from './common.js';
import { getSession } from './apiClient.js';
import { getStatus, connect, disconnect, listRepos, listContents } from './github.js';

// Campos a aumentar: -caminho/-repo viram seletor de repositório; -arquivo/-dir/
// -comp/-area viram seletor de caminho dentro do repo.
const REPO_SUFFIX = /-(caminho|repo)$/;
const PATH_SUFFIX = /-(arquivo|dir|comp|area)$/;

// Marca GitHub (octocat) em SVG — herda currentColor.
const GH_MARK =
  '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">' +
  '<path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38' +
  '0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53' +
  '.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95' +
  '0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27' +
  '1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48' +
  '0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';

let _modal = null;
let _trap = null;
let _returnFocus = null;

// ───────────────────────── Augmentação dos campos ─────────────────────────

export function initGithubFields(root = document) {
  const panels = root.querySelectorAll('.template-panel');
  if (!panels.length) return; // só na página do gerador
  panels.forEach((panel) => {
    panel.querySelectorAll('input[type="text"]').forEach((input) => {
      if (REPO_SUFFIX.test(input.id)) augment(input, 'repo');
      else if (PATH_SUFFIX.test(input.id)) augment(input, 'path');
    });
  });
}

function augment(input, kind) {
  if (input.dataset.ghAugmented) return;
  input.dataset.ghAugmented = '1';

  const wrap = document.createElement('div');
  wrap.className = 'pe-gh-field';
  input.parentNode.insertBefore(wrap, input);
  wrap.appendChild(input);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'pe-gh-btn';
  btn.title = t('github.pick');
  btn.setAttribute('aria-label', t('github.pick'));
  btn.innerHTML = GH_MARK;
  btn.addEventListener('click', () => openPicker(input, kind));
  wrap.appendChild(btn);
}

function fillField(input, value, kind) {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.focus();
  closePicker();
  if (window.PE && typeof window.PE.track === 'function') {
    window.PE.track('github_pick', { kind });
  }
}

// ───────────────────────── Modal do seletor ─────────────────────────

async function openPicker(input, kind) {
  _returnFocus = document.activeElement;
  _modal = buildShell();
  document.body.appendChild(_modal);
  _modal.hidden = false;
  _trap = trapFocus(_modal, closePicker);

  if (!getSession()?.access) {
    renderMessage(t('github.needLogin'));
    return;
  }
  renderLoading();
  const status = await getStatus(true);
  if (!status.enabled) return renderMessage(t('github.disabled'));
  if (!status.connected) return renderConnect();
  renderRepoStep(input, kind, status);
}

function buildShell() {
  const overlay = document.createElement('div');
  overlay.className = 'pe-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', t('github.title'));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePicker();
  });

  const modal = document.createElement('div');
  modal.className = 'pe-modal pe-gh-modal';

  const head = document.createElement('div');
  head.className = 'pe-gh-head';
  const h = document.createElement('h2');
  h.textContent = t('github.title');
  const closeBtn = iconBtn('✕', t('auth.close'), closePicker);
  head.append(h, closeBtn);

  const body = document.createElement('div');
  body.className = 'pe-gh-body';

  modal.append(head, body);
  overlay.append(modal);
  return overlay;
}

function body() {
  return _modal.querySelector('.pe-gh-body');
}

function closePicker() {
  if (_trap) {
    _trap();
    _trap = null;
  }
  if (_modal) {
    _modal.remove();
    _modal = null;
  }
  if (_returnFocus && _returnFocus.focus) {
    _returnFocus.focus();
    _returnFocus = null;
  }
}

function renderLoading() {
  body().innerHTML = `<p class="pe-gh-muted">${t('github.loading')}</p>`;
}

function renderMessage(msg) {
  body().innerHTML = `<p class="pe-gh-muted">${msg}</p>`;
}

function renderConnect() {
  const b = body();
  b.innerHTML = '';
  const p = document.createElement('p');
  p.className = 'pe-gh-muted';
  p.textContent = t('github.connectPrompt');
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'pe-btn pe-gh-connect';
  btn.innerHTML = `${GH_MARK}<span>${t('github.connectBtn')}</span>`;
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    const ok = await connect();
    if (!ok) {
      btn.disabled = false;
      showToast(t('github.error'), '', 'error');
    }
  });
  b.append(p, btn);
}

// Passo 1: busca e seleção de repositório.
async function renderRepoStep(input, kind, status) {
  const b = body();
  b.innerHTML = '';

  const bar = document.createElement('div');
  bar.className = 'pe-gh-bar';
  const who = document.createElement('span');
  who.className = 'pe-gh-muted';
  who.textContent = `@${status.login}`;
  bar.append(who);

  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'pe-gh-search';
  search.placeholder = t('github.searchRepos');
  search.setAttribute('aria-label', t('github.searchRepos'));

  const list = document.createElement('div');
  list.className = 'pe-gh-list';

  b.append(bar, search, list);
  search.focus();

  let timer = null;
  const load = async (q) => {
    list.innerHTML = `<p class="pe-gh-muted">${t('github.loading')}</p>`;
    const repos = await listRepos(q);
    if (!repos.length) {
      list.innerHTML = `<p class="pe-gh-muted">${t('github.noRepos')}</p>`;
      return;
    }
    list.innerHTML = '';
    repos.forEach((r) => {
      const row = rowButton(
        `${repoIcon(r.private)} ${r.full_name}`,
        r.pushed_at ? new Date(r.pushed_at).toLocaleDateString() : '',
      );
      row.addEventListener('click', () => {
        if (kind === 'repo') fillField(input, r.full_name, kind);
        else renderTreeStep(input, r, '');
      });
      list.append(row);
    });
  };
  search.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => load(search.value.trim()), 250);
  });
  load('');
}

// Passo 2 (campos de caminho): navegação na árvore do repositório.
async function renderTreeStep(input, repo, path) {
  const b = body();
  b.innerHTML = '';

  const crumbs = document.createElement('div');
  crumbs.className = 'pe-gh-crumbs';
  const parts = path ? path.split('/') : [];
  const mkCrumb = (label, target) => {
    const c = document.createElement('button');
    c.type = 'button';
    c.className = 'pe-gh-crumb';
    c.textContent = label;
    c.addEventListener('click', () => renderTreeStep(input, repo, target));
    return c;
  };
  crumbs.append(mkCrumb(repo.name, ''));
  parts.forEach((seg, i) => {
    crumbs.append(document.createTextNode(' / '));
    crumbs.append(mkCrumb(seg, parts.slice(0, i + 1).join('/')));
  });

  const useFolder = document.createElement('button');
  useFolder.type = 'button';
  useFolder.className = 'pe-btn-secondary pe-gh-usefolder';
  useFolder.textContent = t('github.useFolder');
  useFolder.addEventListener('click', () => fillField(input, path || repo.full_name, 'path'));

  const list = document.createElement('div');
  list.className = 'pe-gh-list';
  list.innerHTML = `<p class="pe-gh-muted">${t('github.loading')}</p>`;

  b.append(crumbs, useFolder, list);

  const res = await listContents(repo.full_name, path);
  if (!res.items.length) {
    list.innerHTML = `<p class="pe-gh-muted">${t('github.emptyDir')}</p>`;
    return;
  }
  list.innerHTML = '';
  res.items.forEach((it) => {
    const isDir = it.type === 'dir';
    const row = rowButton(`${isDir ? '📁' : '📄'} ${it.name}`, '');
    row.addEventListener('click', () => {
      if (isDir) renderTreeStep(input, repo, it.path);
      else fillField(input, it.path, 'path');
    });
    list.append(row);
  });
}

// ───────────────────────── Helpers de UI ─────────────────────────

function rowButton(label, meta) {
  const row = document.createElement('button');
  row.type = 'button';
  row.className = 'pe-gh-row';
  const name = document.createElement('span');
  name.className = 'pe-gh-row-name';
  name.textContent = label;
  row.append(name);
  if (meta) {
    const m = document.createElement('span');
    m.className = 'pe-gh-row-meta';
    m.textContent = meta;
    row.append(m);
  }
  return row;
}

function iconBtn(emoji, label, onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'pe-icon-btn';
  btn.setAttribute('aria-label', label);
  btn.title = label;
  const span = document.createElement('span');
  span.setAttribute('aria-hidden', 'true');
  span.textContent = emoji;
  btn.append(span);
  btn.addEventListener('click', onClick);
  return btn;
}

const repoIcon = (priv) => (priv ? '🔒' : '📦');

// ───────────────────────── Conexão na barra de preferências ─────────────────────────
// Retorna um botão que reflete e alterna o estado da conexão (usado no menu ⚙️).
export function buildGithubMenuButton() {
  const btn = document.createElement('button');
  btn.type = 'button';
  const refresh = async () => {
    if (!getSession()?.access) {
      btn.textContent = t('github.menu.connect');
      btn.disabled = true;
      return;
    }
    btn.disabled = false;
    const s = await getStatus(true);
    btn.textContent = s.connected
      ? `${t('github.menu.disconnect')} (@${s.login})`
      : t('github.menu.connect');
    btn.dataset.connected = s.connected ? '1' : '';
  };
  btn.addEventListener('click', async () => {
    if (btn.dataset.connected) {
      await disconnect();
      showToast(t('github.disconnected'), '', 'info');
      refresh();
    } else {
      await connect();
    }
  });
  refresh();
  return btn;
}

// Trata o retorno do OAuth (?github=connected|error|disabled) com um toast.
export function handleGithubCallbackParam() {
  const params = new URLSearchParams(location.search);
  const r = params.get('github');
  if (!r) return;
  if (r === 'connected') showToast(t('github.connected'), '', 'success');
  else if (r === 'disabled') showToast(t('github.disabled'), '', 'error');
  else showToast(t('github.error'), '', 'error');
  getStatus(true);
  // Limpa o parâmetro da URL sem recarregar.
  params.delete('github');
  const qs = params.toString();
  history.replaceState(null, '', location.pathname + (qs ? `?${qs}` : '') + location.hash);
}
