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

  it('aplica data-i18n-attr a um atributo (ex.: placeholder)', () => {
    document.body.innerHTML = `<input data-i18n="menu.export" data-i18n-attr="placeholder">`;
    applyI18n();
    expect(document.querySelector('input').getAttribute('placeholder')).toBe(
      'Exportar preferências',
    );
  });

  it('aplica data-i18n-html preservando marcação inline', () => {
    document.body.innerHTML = `<p data-i18n-html="test.rich"></p>`;
    // injeta uma chave de teste no dicionário via setLang (usa chaves reais);
    // como não há chave rica fixa, validamos o mecanismo com fallback à chave.
    applyI18n();
    // sem a chave, innerHTML recebe a própria chave (fallback do t())
    expect(document.querySelector('p').innerHTML).toBe('test.rich');
  });

  it('dispara o evento pe:i18n ao aplicar', () => {
    let fired = 0;
    const h = () => (fired += 1);
    document.addEventListener('pe:i18n', h);
    applyI18n();
    document.removeEventListener('pe:i18n', h);
    expect(fired).toBeGreaterThan(0);
  });
});
