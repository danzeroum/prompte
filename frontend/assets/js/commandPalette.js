// commandPalette.js — paleta de comando global (Ctrl/Cmd+K) (#M-UX4).
// Resolve três achados de IA da auditoria de uma vez: (1) ausência de busca
// global, (2) lista quase plana de ~36 itens difícil de varrer e (3) a falta de
// ponte entre os dois geradores. Indexa, num só lugar: as páginas, os 25
// templates do gerador (de generators.js) e os itens de painel da página atual.
// É acessível: role=dialog, foco preso, Esc, setas para navegar, Enter para abrir.

import { generatorTemplates } from './generators.js';
import { t } from './i18n.js';
import { trapFocus } from './common.js';

let _overlay = null;
let _input = null;
let _list = null;
let _trap = null;
let _returnFocus = null;
let _items = [];
let _filtered = [];
let _active = 0;

const norm = (s) =>
  (s || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

// Rótulo limpo do item: texto sem o emoji decorativo (.icon) nem badges.
function labelOf(el) {
  const clone = el.cloneNode(true);
  clone.querySelectorAll('.icon, .badge, .badge-new').forEach((n) => n.remove());
  return clone.textContent.replace(/\s+/g, ' ').trim();
}

// Monta o índice pesquisável a partir do DOM da página + dos templates.
export function buildIndex(root = document) {
  const items = [];
  const onPageTemplates = new Set();

  // Itens de painel da página atual (jump in-page): data-t / data-template.
  root.querySelectorAll('[data-t], [data-template]').forEach((el) => {
    const label = labelOf(el);
    if (!label) return;
    const key = el.getAttribute('data-template') || el.getAttribute('data-t');
    if (key) onPageTemplates.add(key);
    items.push({
      label,
      hint: t('palette.section'),
      run: () => {
        el.click();
        el.scrollIntoView({ block: 'nearest' });
      },
    });
  });

  // Links de página (navegação entre páginas).
  root.querySelectorAll('a.sb-item[href], a.sidebar-item[href]').forEach((a) => {
    const label = labelOf(a);
    if (label)
      items.push({
        label,
        hint: t('palette.page'),
        run: () => (location.href = a.getAttribute('href')),
      });
  });

  // Templates do gerador não presentes nesta página → deep-link cross-page.
  Object.keys(generatorTemplates).forEach((key) => {
    const tpl = generatorTemplates[key];
    if (tpl.playground || onPageTemplates.has(key)) return;
    // Os geradores avançados (gen-*) vivem no index.html; os demais no generator.html.
    const page = key.startsWith('gen-') ? '/index.html' : '/generator.html';
    items.push({
      label: tpl.name,
      hint: t('palette.template'),
      run: () => (location.href = page + '#t=' + key),
    });
  });

  // De-duplica por rótulo+tipo.
  const seen = new Set();
  return items.filter((i) => {
    const k = i.label + '|' + i.hint;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// Filtro por subsequência simples, insensível a acento e caixa.
export function filterItems(items, query) {
  const q = norm(query);
  if (!q) return items.slice(0, 50);
  return items.filter((i) => norm(i.label).includes(q) || norm(i.hint).includes(q)).slice(0, 50);
}

function renderList() {
  _list.textContent = '';
  if (_active >= _filtered.length) _active = Math.max(0, _filtered.length - 1);
  _filtered.forEach((item, idx) => {
    const li = document.createElement('li');
    li.className = 'pe-cp-item' + (idx === _active ? ' active' : '');
    li.id = 'pe-cp-item-' + idx;
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', String(idx === _active));
    const label = document.createElement('span');
    label.className = 'pe-cp-label';
    label.textContent = item.label;
    const hint = document.createElement('span');
    hint.className = 'pe-cp-hint';
    hint.textContent = item.hint;
    li.append(label, hint);
    li.addEventListener('click', () => activate(idx));
    li.addEventListener('mousemove', () => {
      if (_active !== idx) {
        _active = idx;
        syncActive();
      }
    });
    _list.appendChild(li);
  });
  syncActive();
}

function syncActive() {
  Array.from(_list.children).forEach((li, idx) => {
    const on = idx === _active;
    li.classList.toggle('active', on);
    li.setAttribute('aria-selected', String(on));
  });
  _input.setAttribute('aria-activedescendant', _filtered.length ? 'pe-cp-item-' + _active : '');
}

function activate(idx) {
  const item = _filtered[idx];
  if (!item) return;
  closePalette();
  item.run();
}

function buildOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'pe-cp-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', t('palette.title'));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePalette();
  });

  const box = document.createElement('div');
  box.className = 'pe-cp-box';

  _input = document.createElement('input');
  _input.type = 'text';
  _input.className = 'pe-cp-input';
  _input.placeholder = t('palette.placeholder');
  _input.setAttribute('role', 'combobox');
  _input.setAttribute('aria-expanded', 'true');
  _input.setAttribute('aria-controls', 'pe-cp-list');
  _input.setAttribute('aria-autocomplete', 'list');
  _input.setAttribute('aria-label', t('palette.placeholder'));

  _list = document.createElement('ul');
  _list.className = 'pe-cp-list';
  _list.id = 'pe-cp-list';
  _list.setAttribute('role', 'listbox');

  _input.addEventListener('input', () => {
    _filtered = filterItems(_items, _input.value);
    _active = 0;
    renderList();
  });
  _input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      _active = Math.min(_active + 1, _filtered.length - 1);
      syncActive();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      _active = Math.max(_active - 1, 0);
      syncActive();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      activate(_active);
    }
  });

  box.append(_input, _list);
  overlay.append(box);
  return overlay;
}

export function openPalette() {
  if (_overlay) return;
  _returnFocus =
    document.activeElement && document.activeElement.focus ? document.activeElement : null;
  _items = buildIndex();
  _filtered = filterItems(_items, '');
  _active = 0;
  _overlay = buildOverlay();
  document.body.appendChild(_overlay);
  _trap = trapFocus(_overlay, closePalette);
  renderList();
  _input.focus();
}

export function closePalette() {
  if (_trap) {
    _trap();
    _trap = null;
  }
  if (_overlay) {
    _overlay.remove();
    _overlay = null;
  }
  if (_returnFocus) {
    _returnFocus.focus();
    _returnFocus = null;
  }
}

// Atalho global Ctrl/Cmd+K + botão visível na topbar (descobribilidade).
export function initCommandPalette(root = document) {
  root.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (_overlay) closePalette();
      else openPalette();
    }
  });

  const controls = root.querySelector ? root.querySelector('.pe-topbar-controls') : null;
  if (controls && !controls.querySelector('.pe-cp-trigger')) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pe-icon-btn pe-cp-trigger';
    btn.setAttribute('aria-label', t('palette.title') + ' (Ctrl/Cmd+K)');
    btn.title = t('palette.title') + ' (Ctrl/Cmd+K)';
    const emoji = document.createElement('span');
    emoji.className = 'pe-emoji';
    emoji.setAttribute('aria-hidden', 'true');
    emoji.textContent = '🔍';
    btn.appendChild(emoji);
    btn.addEventListener('click', () => openPalette());
    controls.prepend(btn);
  }
}
