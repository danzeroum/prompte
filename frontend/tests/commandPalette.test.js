// commandPalette.test.js — valida a paleta de comando global (#M-UX4): índice
// cruzado de páginas/templates/seções, filtro insensível a acento, e o ciclo
// abrir/fechar acessível.

import { buildIndex, filterItems, openPalette, closePalette } from '../assets/js/commandPalette.js';

afterEach(() => {
  closePalette();
  document.body.innerHTML = '';
});

describe('buildIndex', () => {
  it('indexa links de página, seções da página atual e templates externos', () => {
    document.body.innerHTML = `
      <nav class="sidebar">
        <a class="sb-item" href="/generator.html"><span class="icon" aria-hidden="true">x</span> Gerador de Prompts</a>
        <div class="sb-item" data-t="overview"><span class="icon" aria-hidden="true">x</span> Visão Geral</div>
      </nav>`;
    const items = buildIndex();
    const labels = items.map((i) => i.label);
    expect(labels).toContain('Gerador de Prompts'); // página
    expect(labels).toContain('Visão Geral'); // seção da página atual
    // templates do gerador (não presentes aqui) entram como deep-link
    expect(items.some((i) => i.hint === 'Template')).toBe(true);
  });
});

describe('filterItems', () => {
  const items = [
    { label: 'Revisão e Correção', hint: 'Template' },
    { label: 'Debug de Erros', hint: 'Template' },
    { label: 'Manual', hint: 'Página' },
  ];
  it('filtra por subsequência insensível a acento e caixa', () => {
    expect(filterItems(items, 'revisao').map((i) => i.label)).toEqual(['Revisão e Correção']);
    expect(filterItems(items, 'DEBUG').map((i) => i.label)).toEqual(['Debug de Erros']);
  });
  it('sem query retorna a lista', () => {
    expect(filterItems(items, '').length).toBe(3);
  });
});

describe('abrir/fechar', () => {
  it('openPalette cria um dialog acessível com input e listbox', () => {
    document.body.innerHTML = '<nav class="sidebar"></nav>';
    openPalette();
    const overlay = document.querySelector('.pe-cp-overlay');
    expect(overlay.getAttribute('role')).toBe('dialog');
    expect(overlay.getAttribute('aria-modal')).toBe('true');
    expect(overlay.querySelector('input.pe-cp-input')).not.toBeNull();
    expect(overlay.querySelector('[role="listbox"]')).not.toBeNull();
    closePalette();
    expect(document.querySelector('.pe-cp-overlay')).toBeNull();
  });

  it('digitar filtra a lista renderizada', () => {
    document.body.innerHTML = '<nav class="sidebar"></nav>';
    openPalette();
    const input = document.querySelector('.pe-cp-input');
    input.value = 'debug';
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
    const opts = [...document.querySelectorAll('.pe-cp-item .pe-cp-label')].map((e) => e.textContent);
    expect(opts.length).toBeGreaterThan(0);
    expect(opts.every((o) => o.toLowerCase().includes('debug'))).toBe(true);
  });
});
