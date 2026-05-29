// glossary.test.js — valida o glossário inline (#M-UX6): decora a primeira
// ocorrência de cada sigla nas descrições e expõe a definição num popover.

import { initGlossary, bindGlossaryToI18n, glossary } from '../assets/js/glossary.js';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('initGlossary', () => {
  it('decora siglas conhecidas com botão acessível e popover oculto', () => {
    document.body.innerHTML =
      '<div class="template-description">Priorização por valor (WSJF) e histórias INVEST.</div>';
    const count = initGlossary();
    expect(count).toBeGreaterThanOrEqual(2);

    const btns = document.querySelectorAll('.pe-gloss');
    expect(btns.length).toBeGreaterThanOrEqual(2);
    const wsjf = [...btns].find((b) => b.textContent.includes('WSJF'));
    expect(wsjf.getAttribute('aria-label')).toContain('WSJF');
    expect(wsjf.getAttribute('aria-expanded')).toBe('false');

    const pop = wsjf.parentNode.querySelector('.pe-gloss-pop');
    expect(pop.hidden).toBe(true);
    expect(pop.textContent).toBe(glossary['WSJF']);

    wsjf.click();
    expect(pop.hidden).toBe(false);
    expect(wsjf.getAttribute('aria-expanded')).toBe('true');
    wsjf.click();
    expect(pop.hidden).toBe(true);
  });

  it('não quebra quando não há descrições', () => {
    document.body.innerHTML = '<div>nada aqui</div>';
    expect(initGlossary()).toBe(0);
  });

  it('decora cada termo só uma vez (primeira ocorrência)', () => {
    document.body.innerHTML =
      '<div class="template-description">WSJF aqui</div>' +
      '<div class="template-description">WSJF de novo</div>';
    initGlossary();
    expect(document.querySelectorAll('.pe-gloss').length).toBe(1);
  });

  it('re-renderiza ao receber o evento pe:i18n (troca de idioma)', () => {
    document.body.innerHTML = '<div class="template-description">Sobre WSJF</div>';
    bindGlossaryToI18n();
    initGlossary();
    expect(document.querySelectorAll('.pe-gloss').length).toBe(1);
    // simula applyI18n reescrevendo o texto (remove o wrapper) e disparando o evento
    document.querySelector('.template-description').textContent = 'Sobre WSJF';
    expect(document.querySelectorAll('.pe-gloss').length).toBe(0);
    document.dispatchEvent(new window.CustomEvent('pe:i18n', { detail: { lang: 'en' } }));
    expect(document.querySelectorAll('.pe-gloss').length).toBe(1);
  });
});
