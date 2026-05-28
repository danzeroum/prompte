// validation.js — validação de campos obrigatórios + feedback via toast.
// Mantido sem dependências de DOM específico das páginas para ser testável.

import { t } from './i18n.js';

let toastWrap = null;

function ensureWrap() {
  if (toastWrap && document.body.contains(toastWrap)) return toastWrap;
  toastWrap = document.createElement('div');
  toastWrap.className = 'pe-toast-wrap';
  toastWrap.setAttribute('aria-live', 'polite');
  toastWrap.setAttribute('role', 'status');
  document.body.appendChild(toastWrap);
  return toastWrap;
}

// type: 'info' | 'success' | 'error'
export function showToast(title, body = '', type = 'info', timeout = 4000) {
  const wrap = ensureWrap();
  const toast = document.createElement('div');
  toast.className = `pe-toast pe-toast-${type}`;
  const strong = document.createElement('strong');
  strong.textContent = title;
  toast.appendChild(strong);
  if (body) {
    const span = document.createElement('span');
    span.textContent = body;
    toast.appendChild(span);
  }
  wrap.appendChild(toast);
  if (timeout > 0) {
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 200);
    }, timeout);
  }
  return toast;
}

// Recebe uma lista de elementos (ou seletores). Retorna { valid, missing[] }.
// Marca os inválidos com a classe .pe-invalid e limpa quando preenchidos.
export function validateRequired(fieldsOrSelectors, root = document) {
  const missing = [];
  const fields = fieldsOrSelectors
    .map((f) => (typeof f === 'string' ? root.querySelector(f) : f))
    .filter(Boolean);

  fields.forEach((el) => {
    const empty = !String(el.value || '').trim();
    el.classList.toggle('pe-invalid', empty);
    if (empty) {
      missing.push(el);
      const clear = () => {
        if (String(el.value || '').trim()) el.classList.remove('pe-invalid');
      };
      el.addEventListener('input', clear, { once: false });
    }
  });

  return { valid: missing.length === 0, missing };
}

// Helper de alto nível usado pelos geradores: valida e, se faltar algo,
// mostra um toast e foca o primeiro campo. Retorna boolean (pode prosseguir).
export function guardRequired(fieldsOrSelectors, root = document) {
  const { valid, missing } = validateRequired(fieldsOrSelectors, root);
  if (!valid) {
    showToast(t('toast.missing.title'), t('toast.missing.body'), 'error');
    missing[0].focus();
  }
  return valid;
}
