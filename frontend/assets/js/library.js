// library.js — tela Biblioteca de Prompts.
// Renderiza o layout 2 colunas: rail (filtros) + main (grid de cards).
// Estado local puro; re-renderiza a grade nos filtros/busca/sort.

import { t } from './i18n.js';
import { track } from './telemetry.js';
import { showToast } from './validation.js';
import { trapFocus } from './common.js';
import {
  listSavedPrompts,
  listCollections,
  deleteSavedPrompt,
  updateSavedPrompt,
  createCollection,
  renameCollection,
  deleteCollection,
} from './savedPrompts.js';
import { renderResultPanel } from './resultPanel.js';

// ---- Estado ----
const state = {
  prompts: [],
  collections: [],
  view: 'all', // 'all' | 'fav' | <collectionId>
  activeTag: null,
  query: '',
  sort: 'recent', // 'recent' | 'name'
};

// ---- Utilitários ----

function esc(s) {
  return String(s || '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d atrás`;
  return d.toLocaleDateString();
}

function collectionName(id) {
  if (!id) return null;
  const col = state.collections.find((c) => c.id === id);
  return col ? col.name : null;
}

// ---- Filtro/sort ----

function filteredPrompts() {
  let list = [...state.prompts];

  if (state.view === 'fav') {
    list = list.filter((p) => p.favorite);
  } else if (state.view !== 'all') {
    list = list.filter((p) => p.collection === state.view);
  }

  if (state.activeTag) {
    list = list.filter((p) => Array.isArray(p.tags) && p.tags.includes(state.activeTag));
  }

  if (state.query.trim()) {
    const q = state.query.trim().toLowerCase();
    list = list.filter(
      (p) =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.content || '').toLowerCase().includes(q) ||
        (Array.isArray(p.tags) && p.tags.some((tag) => tag.toLowerCase().includes(q))),
    );
  }

  if (state.sort === 'name') {
    list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }
  // 'recent' já é a ordem de listSavedPrompts (created_at desc)

  return list;
}

function allTags() {
  const set = new Set();
  state.prompts.forEach((p) => {
    if (Array.isArray(p.tags)) p.tags.forEach((tag) => set.add(tag));
  });
  return [...set].sort();
}

function counters() {
  const all = state.prompts.length;
  const fav = state.prompts.filter((p) => p.favorite).length;
  const byCol = {};
  state.collections.forEach((c) => {
    byCol[c.id] = 0;
  });
  state.prompts.forEach((p) => {
    if (p.collection && byCol[p.collection] !== undefined) byCol[p.collection]++;
  });
  return { all, fav, byCol };
}

// ---- Render principal ----

let _root = null;

export async function initLibrary(container) {
  _root = container;
  await reload();
  render();
}

async function reload() {
  [state.prompts, state.collections] = await Promise.all([listSavedPrompts(), listCollections()]);
}

function render() {
  if (!_root) return;
  _root.innerHTML = '';

  const rail = buildRail();
  const main = buildMain();

  _root.appendChild(rail);
  _root.appendChild(main);
}

// ---- Rail ----

function buildRail() {
  const rail = document.createElement('aside');
  rail.className = 'lib-rail';
  rail.setAttribute('aria-label', 'Filtros da biblioteca');

  const cnt = counters();

  // Seção Biblioteca
  const libSec = buildRailSection(t('lib.title'));
  libSec.appendChild(buildRailItem('all', '⊞', t('lib.all'), cnt.all, state.view === 'all'));
  libSec.appendChild(buildRailItem('fav', '★', t('lib.favorites'), cnt.fav, state.view === 'fav'));
  rail.appendChild(libSec);

  // Seção Coleções
  const colSec = buildRailSection(t('lib.collections'));
  state.collections.forEach((col) => {
    colSec.appendChild(
      buildRailItem(col.id, '📁', col.name, cnt.byCol[col.id] ?? 0, state.view === col.id, col),
    );
  });

  // Botão Nova Coleção
  const newColBtn = document.createElement('button');
  newColBtn.type = 'button';
  newColBtn.className = 'lib-new-col-btn';
  newColBtn.textContent = `+ ${t('lib.new.collection')}`;
  newColBtn.addEventListener('click', () => startNewCollection(colSec, newColBtn));
  colSec.appendChild(newColBtn);
  rail.appendChild(colSec);

  // Seção Tags
  const tags = allTags();
  if (tags.length > 0) {
    const tagSec = buildRailSection(t('lib.tags'));
    const tagCloud = document.createElement('div');
    tagCloud.className = 'lib-tag-cloud';
    tags.forEach((tag) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'lib-tag-chip' + (state.activeTag === tag ? ' active' : '');
      chip.textContent = `#${tag}`;
      chip.addEventListener('click', () => {
        state.activeTag = state.activeTag === tag ? null : tag;
        render();
      });
      tagCloud.appendChild(chip);
    });
    tagSec.appendChild(tagCloud);
    rail.appendChild(tagSec);
  }

  return rail;
}

function buildRailSection(title) {
  const sec = document.createElement('div');
  sec.className = 'lib-rail-sec';
  const label = document.createElement('div');
  label.className = 'lib-rail-sec-title';
  label.textContent = title;
  sec.appendChild(label);
  return sec;
}

function buildRailItem(viewId, icon, label, count, active, col) {
  const item = document.createElement('button');
  item.type = 'button';
  item.className = 'lib-rail-item' + (active ? ' active' : '');
  if (active) item.setAttribute('aria-current', 'page');

  item.innerHTML = `<span class="lib-rail-icon" aria-hidden="true">${esc(icon)}</span>
    <span class="lib-rail-label">${esc(label)}</span>
    <span class="lib-rail-count">${count}</span>`;

  item.addEventListener('click', () => {
    state.view = viewId;
    state.activeTag = null;
    render();
    track('lib_filter', { view: viewId });
  });

  // Ações de coleção (rename / delete) via botão contextual
  if (col) {
    const actWrap = document.createElement('span');
    actWrap.className = 'lib-rail-actions';

    const renBtn = document.createElement('button');
    renBtn.type = 'button';
    renBtn.className = 'lib-rail-act';
    renBtn.title = t('lib.rename');
    renBtn.textContent = '✏️';
    renBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      startRenameCollection(col.id, label, item);
    });

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'lib-rail-act lib-rail-act--danger';
    delBtn.title = t('lib.delete.col.title');
    delBtn.textContent = '🗑';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openConfirmDialog({
        title: t('lib.delete.col.title'),
        body: t('lib.delete.col.body'),
        confirmLabel: t('lib.delete.confirm'),
        danger: true,
        onConfirm: async () => {
          await deleteCollection(col.id);
          if (state.view === col.id) state.view = 'all';
          showToast(t('lib.col.deleted'), '', 'success');
          track('lib_delete_collection', { id: col.id });
          await reload();
          render();
        },
      });
    });

    actWrap.append(renBtn, delBtn);
    item.appendChild(actWrap);
  }

  return item;
}

function startNewCollection(parent, afterEl) {
  const wrap = document.createElement('div');
  wrap.className = 'lib-new-col-wrap';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'lib-new-col-input';
  input.placeholder = t('lib.col.new.placeholder');
  input.maxLength = 60;

  const confirm = async () => {
    const name = input.value.trim();
    if (!name) {
      input.focus();
      return;
    }
    const res = await createCollection(name);
    if (res.ok) {
      showToast(t('lib.col.created'), '', 'success');
      track('lib_create_collection');
      await reload();
    }
    wrap.remove();
    render();
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirm();
    if (e.key === 'Escape') {
      wrap.remove();
      render();
    }
  });

  wrap.appendChild(input);
  parent.insertBefore(wrap, afterEl);
  input.focus();
}

async function startRenameCollection(id, currentName, itemEl) {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'lib-new-col-input';
  input.value = currentName;
  input.maxLength = 60;

  const confirm = async () => {
    const name = input.value.trim();
    if (!name) {
      input.focus();
      return;
    }
    await renameCollection(id, name);
    showToast(t('lib.col.renamed'), '', 'success');
    track('lib_rename_collection', { id });
    input.remove();
    await reload();
    render();
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirm();
    if (e.key === 'Escape') {
      input.remove();
      render();
    }
  });
  input.addEventListener('blur', confirm);

  itemEl.querySelector('.lib-rail-label').replaceWith(input);
  input.select();
}

// ---- Main (grid) ----

function buildMain() {
  const main = document.createElement('div');
  main.className = 'lib-main';

  // Cabeçalho
  const header = document.createElement('div');
  header.className = 'lib-main-header';

  const titleWrap = document.createElement('div');
  const title = document.createElement('h2');
  title.className = 'lib-main-title';
  title.textContent = viewTitle();

  const subtitle = document.createElement('p');
  subtitle.className = 'lib-main-subtitle';
  const cnt = filteredPrompts().length;
  subtitle.textContent =
    t('lib.prompts.count').replace('{n}', cnt) + (state.activeTag ? ` · #${state.activeTag}` : '');

  titleWrap.append(title, subtitle);

  const newBtn = document.createElement('a');
  newBtn.href = '/generator.html';
  newBtn.className = 'pe-btn lib-new-prompt-btn';
  newBtn.textContent = t('lib.new.prompt');

  header.append(titleWrap, newBtn);
  main.appendChild(header);

  // Toolbar
  main.appendChild(buildToolbar());

  // Grid ou estado vazio
  const list = filteredPrompts();
  if (list.length === 0) {
    main.appendChild(buildEmptyState());
  } else {
    const grid = document.createElement('div');
    grid.className = 'lib-grid';
    list.forEach((p) => grid.appendChild(buildCard(p)));
    main.appendChild(grid);
  }

  return main;
}

function viewTitle() {
  if (state.view === 'all') return t('lib.all');
  if (state.view === 'fav') return t('lib.favorites');
  return collectionName(state.view) || t('lib.title');
}

function buildToolbar() {
  const bar = document.createElement('div');
  bar.className = 'lib-toolbar';

  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'lib-search';
  search.placeholder = t('lib.search.placeholder');
  search.value = state.query;
  search.setAttribute('aria-label', t('lib.search.placeholder'));
  search.addEventListener('input', () => {
    state.query = search.value;
    // Só re-renderiza a grade, mantendo o rail
    const mainEl = _root.querySelector('.lib-main');
    if (mainEl) mainEl.replaceWith(buildMain());
  });

  const sortWrap = document.createElement('div');
  sortWrap.className = 'lib-sort';
  sortWrap.setAttribute('role', 'group');
  sortWrap.setAttribute('aria-label', 'Ordenação');

  ['recent', 'name'].forEach((s) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lib-sort-btn' + (state.sort === s ? ' active' : '');
    btn.textContent = t(`lib.sort.${s}`);
    btn.setAttribute('aria-pressed', String(state.sort === s));
    btn.addEventListener('click', () => {
      state.sort = s;
      const mainEl = _root.querySelector('.lib-main');
      if (mainEl) mainEl.replaceWith(buildMain());
    });
    sortWrap.appendChild(btn);
  });

  bar.append(search, sortWrap);
  return bar;
}

function buildEmptyState() {
  const wrap = document.createElement('div');
  wrap.className = 'lib-empty';

  const icon = document.createElement('div');
  icon.className = 'lib-empty-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '📚';

  const h = document.createElement('h3');
  h.textContent = t('lib.empty.title');

  const p = document.createElement('p');
  p.textContent = t('lib.empty.body');

  const cta = document.createElement('a');
  cta.href = '/generator.html';
  cta.className = 'pe-btn';
  cta.textContent = t('lib.empty.cta');

  wrap.append(icon, h, p, cta);
  return wrap;
}

// ---- Card ----

function buildCard(prompt) {
  const card = document.createElement('div');
  card.className = 'lib-card';

  // Topo: grupo + favorito
  const top = document.createElement('div');
  top.className = 'lib-card-top';

  const group = document.createElement('span');
  group.className = 'lib-card-group';
  group.textContent = prompt.template || '—';

  const starBtn = document.createElement('button');
  starBtn.type = 'button';
  starBtn.className = 'lib-card-star' + (prompt.favorite ? ' on' : '');
  starBtn.textContent = prompt.favorite ? '★' : '☆';
  starBtn.title = prompt.favorite ? t('lib.unfavorited') : t('lib.favorited');
  starBtn.setAttribute('aria-pressed', String(!!prompt.favorite));
  starBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const next = !prompt.favorite;
    // Atualização otimista
    prompt.favorite = next;
    starBtn.textContent = next ? '★' : '☆';
    starBtn.className = 'lib-card-star' + (next ? ' on' : '');
    starBtn.setAttribute('aria-pressed', String(next));
    await updateSavedPrompt(prompt.id || prompt.ts, { favorite: next });
    showToast(t(next ? 'lib.favorited' : 'lib.unfavorited'), '', 'success');
    track('lib_toggle_favorite', { favorite: next });
    // Atualiza contadores no rail
    const railEl = _root.querySelector('.lib-rail');
    if (railEl) railEl.replaceWith(buildRail());
  });

  top.append(group, starBtn);

  // Corpo (clicável)
  const body = document.createElement('div');
  body.className = 'lib-card-body';
  body.setAttribute('role', 'button');
  body.setAttribute('tabindex', '0');

  const name = document.createElement('div');
  name.className = 'lib-card-name';
  name.textContent = prompt.title || prompt.template || '(sem título)';

  const snippet = document.createElement('div');
  snippet.className = 'lib-card-snippet';
  snippet.textContent = (prompt.content || '').slice(0, 180);

  body.append(name, snippet);
  body.addEventListener('click', () => openPromptView(prompt));
  body.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPromptView(prompt);
    }
  });

  // Tags
  const tags = Array.isArray(prompt.tags) ? prompt.tags.filter(Boolean) : [];
  if (tags.length > 0) {
    const tagRow = document.createElement('div');
    tagRow.className = 'lib-card-tags';
    tags.forEach((tag) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'lib-card-tag-chip';
      chip.textContent = `#${tag}`;
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        state.activeTag = state.activeTag === tag ? null : tag;
        render();
      });
      tagRow.appendChild(chip);
    });
    body.appendChild(tagRow);
  }

  // Rodapé: meta + ações
  const footer = document.createElement('div');
  footer.className = 'lib-card-footer';

  const meta = document.createElement('span');
  meta.className = 'lib-card-meta';
  const colName = collectionName(prompt.collection);
  meta.innerHTML =
    (colName ? `<span class="lib-card-col">📁 ${esc(colName)}</span> · ` : '') +
    `<span class="lib-card-time">${esc(relativeTime(prompt.created_at || prompt.ts))}</span>`;

  const actions = document.createElement('div');
  actions.className = 'lib-card-actions';

  // Mover para coleção
  const moveBtn = buildCardBtn('📂', t('lib.move'));
  const moveMenu = buildMoveMenu(prompt);
  moveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    moveMenu.hidden = !moveMenu.hidden;
  });

  // Copiar
  const copyBtn = buildCardBtn('📋', 'Copiar');
  copyBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(prompt.content || '').catch(() => {});
    showToast('Copiado!', '', 'success');
    track('lib_copy', { template: prompt.template });
  });

  // Abrir
  const openBtn = buildCardBtn('↗', 'Abrir');
  openBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openPromptView(prompt);
  });

  // Excluir
  const delBtn = buildCardBtn('🗑', 'Excluir');
  delBtn.className += ' lib-card-btn--danger';
  delBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openConfirmDialog({
      title: t('lib.delete.title'),
      body: t('lib.delete.body').replace('{name}', prompt.title || ''),
      confirmLabel: t('lib.delete.confirm'),
      danger: true,
      onConfirm: async () => {
        await deleteSavedPrompt(prompt.id || prompt.ts);
        showToast(t('lib.deleted'), '', 'success');
        track('lib_delete_prompt', { template: prompt.template });
        await reload();
        render();
      },
    });
  });

  actions.append(moveBtn, moveMenu, copyBtn, openBtn, delBtn);
  footer.append(meta, actions);

  card.append(top, body, footer);
  return card;
}

function buildCardBtn(icon, label) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'lib-card-btn';
  btn.title = label;
  btn.setAttribute('aria-label', label);
  btn.textContent = icon;
  return btn;
}

function buildMoveMenu(prompt) {
  const menu = document.createElement('div');
  menu.className = 'lib-move-menu';
  menu.hidden = true;
  menu.setAttribute('role', 'menu');

  const noCol = document.createElement('button');
  noCol.type = 'button';
  noCol.role = 'menuitem';
  noCol.className = 'lib-move-item';
  noCol.textContent = t('lib.no.collection');
  noCol.addEventListener('click', async () => {
    menu.hidden = true;
    await updateSavedPrompt(prompt.id || prompt.ts, { collection: null });
    prompt.collection = null;
    track('lib_move_prompt', { collection: null });
    await reload();
    render();
  });
  menu.appendChild(noCol);

  state.collections.forEach((col) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.role = 'menuitem';
    item.className = 'lib-move-item' + (prompt.collection === col.id ? ' current' : '');
    item.textContent = col.name;
    item.addEventListener('click', async () => {
      menu.hidden = true;
      await updateSavedPrompt(prompt.id || prompt.ts, { collection: col.id });
      prompt.collection = col.id;
      track('lib_move_prompt', { collection: col.id });
      await reload();
      render();
    });
    menu.appendChild(item);
  });

  // Fechar ao clicar fora
  document.addEventListener(
    'click',
    (e) => {
      if (!menu.contains(e.target)) menu.hidden = true;
    },
    { capture: false },
  );

  return menu;
}

// ---- Visualizar prompt salvo ----

function openPromptView(prompt) {
  const overlay = document.createElement('div');
  overlay.className = 'pe-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', prompt.title || 'Prompt');

  const modal = document.createElement('div');
  modal.className = 'pe-modal lib-view-modal';

  const head = document.createElement('div');
  head.className = 'pe-history-head';
  const h = document.createElement('h2');
  h.textContent = prompt.title || prompt.template || 'Prompt';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'pe-icon-btn';
  closeBtn.textContent = '✕';
  closeBtn.setAttribute('aria-label', 'Fechar');
  const close = () => {
    overlay.remove();
    if (trap) trap();
  };
  closeBtn.addEventListener('click', close);
  head.append(h, closeBtn);

  const panelHost = document.createElement('div');
  // Não re-adiciona ao histórico ao abrir da biblioteca (flag skip)
  renderResultPanel(panelHost, {
    id: prompt.template,
    prompt: prompt.content,
    title: prompt.title,
    skipHistory: true,
  });

  modal.append(head, panelHost);
  overlay.appendChild(modal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.body.appendChild(overlay);

  const trap = trapFocus(overlay, close);
  closeBtn.focus();

  track('lib_open_prompt', { template: prompt.template });
}

// ---- Diálogo de confirmação genérico ----

function openConfirmDialog({ title, body, confirmLabel, danger, onConfirm }) {
  const overlay = document.createElement('div');
  overlay.className = 'pe-modal-overlay';
  overlay.setAttribute('role', 'alertdialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', title);

  const modal = document.createElement('div');
  modal.className = 'pe-modal lib-confirm-modal';

  const h = document.createElement('h3');
  h.textContent = title;

  const p = document.createElement('p');
  p.textContent = body;

  const actions = document.createElement('div');
  actions.className = 'pe-modal-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'pe-btn-secondary';
  cancelBtn.textContent = t('lib.delete.cancel');
  const close = () => {
    overlay.remove();
    if (trap) trap();
  };
  cancelBtn.addEventListener('click', close);

  const confirmBtn = document.createElement('button');
  confirmBtn.type = 'button';
  confirmBtn.className = 'pe-btn' + (danger ? ' pe-btn-danger' : '');
  confirmBtn.textContent = confirmLabel;
  confirmBtn.addEventListener('click', () => {
    close();
    onConfirm();
  });

  actions.append(cancelBtn, confirmBtn);
  modal.append(h, p, actions);
  overlay.appendChild(modal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.body.appendChild(overlay);

  const trap = trapFocus(overlay, close);
  confirmBtn.focus();
}

// ---- Init automático na página da Biblioteca ----

const libRoot = document.getElementById('pe-library');
if (libRoot) {
  initLibrary(libRoot);
}

// ---- Banner da Home ----

export async function renderLibraryBanner(container) {
  if (!container) return;
  const prompts = await listSavedPrompts();
  const n = prompts.length;

  const banner = document.createElement('a');
  banner.href = '/library.html';
  banner.className = 'lib-home-banner';
  banner.setAttribute('aria-label', `${t('home.lib.banner')} — ${t('home.lib.cta')}`);

  const icon = document.createElement('span');
  icon.className = 'lib-home-banner-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '📚';

  const text = document.createElement('span');
  text.className = 'lib-home-banner-text';
  const strong = document.createElement('strong');
  strong.textContent = t('home.lib.banner');
  const sub = document.createElement('span');
  sub.textContent = n > 0 ? t('home.lib.banner.sub').replace('{n}', n) : t('home.lib.banner.empty');
  text.append(strong, ' ', sub);

  const cta = document.createElement('span');
  cta.className = 'lib-home-banner-cta';
  cta.textContent = t('home.lib.cta') + ' →';

  banner.append(icon, text, cta);
  container.appendChild(banner);
}
