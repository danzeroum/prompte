// i18n.js — internacionalização leve baseada em atributos data-i18n.
// Uso no HTML: <span data-i18n="topbar.settings">Preferências</span>
//              <input data-i18n-attr="placeholder" data-i18n="form.repo">
// pt está completo para a "chrome" da aplicação (controles, toasts, menus);
// en é um stub a ser expandido. Tagear o conteúdo das páginas é incremental.

import { getPreferences, setPreference } from './preferences.js';

export const DICT = {
  pt: {
    'topbar.settings': 'Preferências',
    'topbar.toggleTheme': 'Alternar tema claro/escuro',
    'menu.appearance': 'Aparência',
    'menu.theme.light': 'Tema claro',
    'menu.theme.dark': 'Tema escuro',
    'menu.theme.system': 'Seguir o sistema',
    'menu.language': 'Idioma',
    'menu.data': 'Dados',
    'menu.export': 'Exportar preferências',
    'menu.import': 'Importar preferências',
    'toast.copied.title': 'Copiado!',
    'toast.copied.body': 'O prompt foi copiado para a área de transferência.',
    'toast.copyError.title': 'Não foi possível copiar',
    'toast.copyError.body': 'Copie manualmente selecionando o texto.',
    'toast.missing.title': 'Campos obrigatórios',
    'toast.missing.body': 'Preencha os campos destacados antes de gerar.',
    'toast.exported.title': 'Preferências exportadas',
    'toast.imported.title': 'Preferências importadas',
    'toast.importError.title': 'Falha ao importar',
    'playground.title': 'Experimente',
    'playground.run': 'Gerar Prompt de Exemplo',
    'menu.account': 'Conta',
    'menu.signin': 'Entrar',
    'menu.signout': 'Sair',
    'auth.title': 'Entrar',
    'auth.desc': 'Receba um link mágico por e-mail. Usuários autenticados têm limite maior.',
    'auth.emailPlaceholder': 'seu@email.com',
    'auth.send': 'Enviar link mágico',
    'auth.sent': 'Link enviado! Verifique seu e-mail.',
    'auth.invalidEmail': 'Informe um e-mail válido.',
    'auth.error': 'Não foi possível enviar o link.',
    'auth.close': 'Fechar',
    'auth.signedInAs': 'Conectado como',
    'auth.signedOut': 'Você saiu da conta.',
  },
  en: {
    'topbar.settings': 'Preferences',
    'topbar.toggleTheme': 'Toggle light/dark theme',
    'menu.appearance': 'Appearance',
    'menu.theme.light': 'Light theme',
    'menu.theme.dark': 'Dark theme',
    'menu.theme.system': 'Follow system',
    'menu.language': 'Language',
    'menu.data': 'Data',
    'menu.export': 'Export preferences',
    'menu.import': 'Import preferences',
    'toast.copied.title': 'Copied!',
    'toast.copied.body': 'The prompt was copied to the clipboard.',
    'toast.copyError.title': 'Could not copy',
    'toast.copyError.body': 'Copy manually by selecting the text.',
    'toast.missing.title': 'Required fields',
    'toast.missing.body': 'Fill in the highlighted fields before generating.',
    'toast.exported.title': 'Preferences exported',
    'toast.imported.title': 'Preferences imported',
    'toast.importError.title': 'Import failed',
    'playground.title': 'Try it',
    'playground.run': 'Generate sample prompt',
    'menu.account': 'Account',
    'menu.signin': 'Sign in',
    'menu.signout': 'Sign out',
    'auth.title': 'Sign in',
    'auth.desc': 'Get a magic link by email. Signed-in users get a higher limit.',
    'auth.emailPlaceholder': 'you@email.com',
    'auth.send': 'Send magic link',
    'auth.sent': 'Link sent! Check your email.',
    'auth.invalidEmail': 'Enter a valid email.',
    'auth.error': 'Could not send the link.',
    'auth.close': 'Close',
    'auth.signedInAs': 'Signed in as',
    'auth.signedOut': 'You have signed out.',
  },
};

let currentLang = 'pt';

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  currentLang = DICT[lang] ? lang : 'pt';
  setPreference('lang', currentLang);
  document.documentElement.setAttribute('lang', currentLang === 'pt' ? 'pt-BR' : 'en');
  applyI18n();
  return currentLang;
}

// Traduz uma chave; cai no português e, por fim, na própria chave.
export function t(key, lang = currentLang) {
  return (DICT[lang] && DICT[lang][key]) || DICT.pt[key] || key;
}

// Aplica traduções a todos os elementos [data-i18n] dentro de root.
export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const attr = el.getAttribute('data-i18n-attr');
    const value = t(key);
    if (attr) el.setAttribute(attr, value);
    else el.textContent = value;
  });
}

export function initI18n() {
  currentLang = getPreferences().lang || 'pt';
  if (!DICT[currentLang]) currentLang = 'pt';
  document.documentElement.setAttribute('lang', currentLang === 'pt' ? 'pt-BR' : 'en');
  applyI18n();
}
