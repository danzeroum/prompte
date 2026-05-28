// theme.js — alternância de tema claro/escuro.
// Ordem de precedência: preferência explícita do usuário > preferência do
// sistema (prefers-color-scheme) > escuro (default histórico da ferramenta).

import { getPreferences, setPreference } from './preferences.js';

const LIGHT = 'light';
const DARK = 'dark';

function systemPrefersLight() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
}

// Resolve qual tema usar dado o estado salvo.
export function resolveTheme() {
  const { theme } = getPreferences();
  if (theme === LIGHT || theme === DARK) return theme;
  return systemPrefersLight() ? LIGHT : DARK;
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle('light-theme', theme === LIGHT);
}

export function currentTheme() {
  return document.documentElement.classList.contains('light-theme') ? LIGHT : DARK;
}

// Alterna e persiste a escolha. Retorna o novo tema.
export function toggleTheme() {
  const next = currentTheme() === LIGHT ? DARK : LIGHT;
  setPreference('theme', next);
  applyTheme(next);
  return next;
}

// Inicializa o tema no load e segue o sistema enquanto o usuário não escolher.
export function initTheme() {
  applyTheme(resolveTheme());
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
      const { theme } = getPreferences();
      if (theme !== LIGHT && theme !== DARK) applyTheme(resolveTheme());
    });
  }
}
