// saveDialog.js — modal "Salvar na biblioteca".
// Substitui o save direto em resultPanel.js: coleta nome, coleção e tags
// antes de chamar savePrompt(). Reutiliza trapFocus de common.js.

import { t } from './i18n.js';
import { track } from './telemetry.js';
import { showToast } from './validation.js';
import { trapFocus } from './common.js';
import { savePrompt, listCollections, createCollection } from './savedPrompts.js';

function esc(s) {
  return String(s || '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}

// Abre o diálogo. Retorna uma Promise que resolve { ok } após confirmar ou cancela.
export function openSaveDialog({ template, content, defaultTitle } = {}) {
  return new Promise((resolve) => {
    let trap = null;
    const returnFocus =
      document.activeElement && document.activeElement.focus ? document.activeElement : null;

    const close = (result = { ok: false }) => {
      if (trap) { trap(); trap = null; }
      overlay.remove();
      if (returnFocus) returnFocus.focus();
      resolve(result);
    };

    // ---- Overlay ----
    const overlay = document.createElement('div');
    overlay.className = 'pe-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', t('save.dialog.title'));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    // ---- Modal ----
    const modal = document.createElement('div');
    modal.className = 'pe-modal save-dialog';
    modal.style.cssText = 'max-width:min(520px,96vw);border-radius:18px;';

    // Título
    const titleEl = document.createElement('h3');
    titleEl.textContent = t('save.dialog.title');
    titleEl.style.cssText = 'margin:0 0 20px;font-size:18px;font-weight:700;';

    // Campo: Nome
    const nameLabel = document.createElement('label');
    nameLabel.textContent = t('save.dialog.name');
    nameLabel.style.cssText = 'display:block;font-size:13px;font-weight:600;margin-bottom:5px;';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'lib-new-col-input';
    nameInput.placeholder = t('save.dialog.name.placeholder');
    nameInput.value = defaultTitle || '';
    nameInput.maxLength = 120;
    nameInput.style.cssText = 'width:100%;margin-bottom:16px;';
    nameLabel.setAttribute('for', 'sd-name');
    nameInput.id = 'sd-name';

    // Campo: Coleção
    const colLabel = document.createElement('label');
    colLabel.textContent = t('save.dialog.collection');
    colLabel.style.cssText = 'display:block;font-size:13px;font-weight:600;margin-bottom:5px;';
    colLabel.setAttribute('for', 'sd-col');

    const colRow = document.createElement('div');
    colRow.style.cssText = 'display:flex;gap:8px;margin-bottom:16px;';

    const colSelect = document.createElement('select');
    colSelect.id = 'sd-col';
    colSelect.className = 'lib-new-col-input';
    colSelect.style.cssText = 'flex:1;';

    const newColBtn = document.createElement('button');
    newColBtn.type = 'button';
    newColBtn.className = 'lib-new-col-btn';
    newColBtn.style.cssText = 'flex-shrink:0;padding:6px 12px;margin:0;width:auto;';
    newColBtn.textContent = t('save.dialog.collection.new');

    // Input inline para nova coleção
    const newColInput = document.createElement('input');
    newColInput.type = 'text';
    newColInput.className = 'lib-new-col-input';
    newColInput.placeholder = t('lib.col.new.placeholder');
    newColInput.maxLength = 60;
    newColInput.style.cssText = 'flex:1;display:none;';

    colRow.append(colSelect, newColInput, newColBtn);

    // Campo: Tags
    const tagsLabel = document.createElement('label');
    tagsLabel.textContent = t('save.dialog.tags');
    tagsLabel.style.cssText = 'display:block;font-size:13px;font-weight:600;margin-bottom:5px;';
    tagsLabel.setAttribute('for', 'sd-tags');
    const tagsInput = document.createElement('input');
    tagsInput.type = 'text';
    tagsInput.id = 'sd-tags';
    tagsInput.className = 'lib-new-col-input';
    tagsInput.placeholder = t('save.dialog.tags.help');
    tagsInput.style.cssText = 'width:100%;margin-bottom:4px;';
    const tagsHelp = document.createElement('p');
    tagsHelp.style.cssText = 'font-size:12px;color:var(--text-3);margin:0 0 20px;';
    tagsHelp.textContent = t('save.dialog.tags.help');

    // Rodapé: ações
    const actions = document.createElement('div');
    actions.className = 'pe-modal-actions';
    actions.style.cssText = 'margin-top:8px;';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'pe-btn-secondary';
    cancelBtn.textContent = t('save.dialog.cancel');
    cancelBtn.addEventListener('click', () => close());

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'pe-btn';
    saveBtn.textContent = t('save.dialog.save');

    actions.append(cancelBtn, saveBtn);
    modal.append(titleEl, nameLabel, nameInput, colLabel, colRow, tagsLabel, tagsInput, tagsHelp, actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    trap = trapFocus(overlay, () => close());
    nameInput.focus();
    nameInput.select();

    // ---- Carregar coleções ----
    let collections = [];
    (async () => {
      collections = await listCollections();
      const none = document.createElement('option');
      none.value = '';
      none.textContent = t('save.dialog.collection.none');
      colSelect.appendChild(none);
      collections.forEach((col) => {
        const opt = document.createElement('option');
        opt.value = col.id;
        opt.textContent = col.name;
        colSelect.appendChild(opt);
      });
    })();

    // ---- Nova coleção inline ----
    let creatingCollection = false;
    newColBtn.addEventListener('click', () => {
      if (!creatingCollection) {
        creatingCollection = true;
        colSelect.style.display = 'none';
        newColInput.style.display = '';
        newColBtn.textContent = '✓';
        newColInput.focus();
      } else {
        confirmNewCol();
      }
    });

    async function confirmNewCol() {
      const name = newColInput.value.trim();
      if (!name) { newColInput.focus(); return; }
      const res = await createCollection(name);
      if (res.ok) {
        const opt = document.createElement('option');
        opt.value = res.id;
        opt.textContent = name;
        colSelect.appendChild(opt);
        colSelect.value = res.id;
      }
      colSelect.style.display = '';
      newColInput.style.display = 'none';
      newColInput.value = '';
      newColBtn.textContent = t('save.dialog.collection.new');
      creatingCollection = false;
    }

    newColInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); confirmNewCol(); }
      if (e.key === 'Escape') {
        colSelect.style.display = '';
        newColInput.style.display = 'none';
        newColInput.value = '';
        newColBtn.textContent = t('save.dialog.collection.new');
        creatingCollection = false;
      }
    });

    // ---- Enter no campo Nome salva ----
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); doSave(); }
    });

    // ---- Ação de salvar ----
    saveBtn.addEventListener('click', doSave);

    async function doSave() {
      const name = nameInput.value.trim();
      if (!name) { nameInput.focus(); return; }

      const tags = tagsInput.value
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const collectionId = colSelect.value || null;

      saveBtn.disabled = true;
      const res = await savePrompt({
        template,
        content,
        title: name,
        collection: collectionId,
        tags,
        favorite: false,
      });

      saveBtn.disabled = false;

      if (res.ok) {
        showToast(
          t(res.where === 'cloud' ? 'result.saved.cloud' : 'result.saved.local'),
          '',
          'success',
        );
        track('save_prompt', { template, where: res.where });
        close({ ok: true });
      } else if (res.needsAuth) {
        showToast(t('result.save.auth'), '', 'info');
        if (window.PE && window.PE.ensureAuth) window.PE.ensureAuth();
        close({ ok: false });
      } else if (res.error !== 'empty') {
        showToast(t('result.save.error'), res.error || '', 'error');
      }
    }
  });
}
