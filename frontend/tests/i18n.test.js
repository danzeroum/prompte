import { t, applyI18n, setLang, getLang } from '../assets/js/i18n.js';

describe('i18n', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setLang('pt');
  });

  it('traduz uma chave conhecida', () => {
    expect(t('topbar.settings', 'pt')).toBe('Preferências');
    expect(t('topbar.settings', 'en')).toBe('Preferences');
  });

  it('cai na própria chave quando não existe', () => {
    expect(t('chave.inexistente')).toBe('chave.inexistente');
  });

  it('aplica traduções a elementos data-i18n', () => {
    document.body.innerHTML = `<span data-i18n="menu.export"></span>`;
    applyI18n();
    expect(document.querySelector('span').textContent).toBe('Exportar preferências');
  });

  it('setLang muda o idioma e o atributo lang do html', () => {
    setLang('en');
    expect(getLang()).toBe('en');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
  });
});
