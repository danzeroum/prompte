// a11y.test.js — valida, de forma reproduzível, as correções de acessibilidade
// aplicadas a partir da auditoria de UX (recs 1, 5, 7). Faz o papel das métricas
// objetivas do teste de usabilidade: "rótulo associado", "resultado anunciável",
// "foco preso", "emoji não lido", "ação destrutiva protegida".

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';
import { trapFocus, injectTopbarControls } from '../assets/js/common.js';
import { addPromptToHistory, getPromptHistory } from '../assets/js/promptHistory.js';

const read = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');
const generator = read('../generator.html');
const index = read('../index.html');
const manual = read('../manual.html');

describe('Rec 1 — rótulos associados aos campos (WCAG 1.3.1)', () => {
  it('todo <label for=> aponta para um id existente e único no generator.html', () => {
    const fors = [...generator.matchAll(/<label for="([^"]+)"/g)].map((m) => m[1]);
    const idCount = {};
    for (const m of generator.matchAll(/\bid="([^"]+)"/g)) idCount[m[1]] = (idCount[m[1]] || 0) + 1;
    expect(fors.length).toBeGreaterThanOrEqual(90);
    for (const f of fors) {
      expect(idCount[f]).toBe(1);
    }
  });
});

describe('Rec 7 — emojis decorativos ocultos do leitor de tela (WCAG 1.1.1)', () => {
  it('nenhum <span class="icon"> de navegação fica sem aria-hidden', () => {
    for (const html of [index, generator, manual]) {
      expect(html.includes('<span class="icon">')).toBe(false);
    }
  });
});

describe('Rec 5 — resultado como região aria-live focável (WCAG 4.1.3)', () => {
  it('cada output-container declara role/aria-live/tabindex', () => {
    const containers = [...generator.matchAll(/<div class="output-container"[^>]*>/g)].map(
      (m) => m[0],
    );
    // 25 + os 10 gen-* migrados (fusão completa): gen-review + lotes 1/2/3.
    expect(containers.length).toBe(35);
    for (const c of containers) {
      expect(c).toContain('role="region"');
      expect(c).toContain('aria-live="polite"');
      expect(c).toContain('tabindex="-1"');
    }
  });
});

describe('Rec 7 — emoji dos botões de ícone fica em <span aria-hidden>', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '<div class="topbar"></div>';
  });

  it('injectTopbarControls cria botões com emoji aria-hidden e aria-label', () => {
    injectTopbarControls();
    const btns = [...document.querySelectorAll('.topbar .pe-icon-btn')];
    expect(btns.length).toBeGreaterThanOrEqual(3);
    for (const b of btns) {
      expect(b.getAttribute('aria-label')).toBeTruthy();
      const emoji = b.querySelector('.pe-emoji');
      expect(emoji).not.toBeNull();
      expect(emoji.getAttribute('aria-hidden')).toBe('true');
    }
  });
});

describe('Rec 7 — foco preso nos modais (trapFocus)', () => {
  it('Tab no último elemento volta para o primeiro', () => {
    document.body.innerHTML =
      '<div id="m"><button id="a">a</button><button id="b">b</button></div>';
    const m = document.getElementById('m');
    const a = document.getElementById('a');
    const b = document.getElementById('b');
    trapFocus(m);
    b.focus();
    const ev = new window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    m.dispatchEvent(ev);
    expect(document.activeElement).toBe(a);
  });

  it('Escape chama o callback de fechamento', () => {
    document.body.innerHTML = '<div id="m"><button>x</button></div>';
    const m = document.getElementById('m');
    const onEscape = jest.fn();
    trapFocus(m, onEscape);
    m.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(onEscape).toHaveBeenCalled();
  });
});

describe('Rec 3 — ação destrutiva exige confirmação (Nielsen H3)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '<div class="topbar"></div>';
    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue() } });
  });

  it('o 1º clique em "Limpar" pede confirmação; só o 2º apaga', () => {
    addPromptToHistory('revisao-correcao', 'conteúdo de teste');
    expect(getPromptHistory().length).toBe(1);

    injectTopbarControls();
    const historyBtn = document.querySelectorAll('.topbar .pe-icon-btn')[1];
    historyBtn.click();

    const overlay = document.querySelector('.pe-modal-overlay');
    expect(overlay).not.toBeNull();
    const clearBtn = [...overlay.querySelectorAll('button')].find(
      (b) => b.textContent === 'Limpar histórico',
    );
    clearBtn.click();
    // ainda não apagou — apareceu a confirmação
    expect(getPromptHistory().length).toBe(1);
    const confirmBtn = [...document.querySelectorAll('.pe-modal-overlay button')].find(
      (b) => b.textContent === 'Sim, limpar',
    );
    expect(confirmBtn).toBeTruthy();
    confirmBtn.click();
    expect(getPromptHistory().length).toBe(0);
    // modal fechado após confirmar
    expect(document.querySelector('.pe-modal-overlay')).toBeNull();
  });

  it('"Cancelar" mantém o histórico intacto', () => {
    addPromptToHistory('revisao-correcao', 'conteúdo de teste');
    injectTopbarControls();
    document.querySelectorAll('.topbar .pe-icon-btn')[1].click();
    const overlay = document.querySelector('.pe-modal-overlay');
    [...overlay.querySelectorAll('button')]
      .find((b) => b.textContent === 'Limpar histórico')
      .click();
    [...overlay.querySelectorAll('button')].find((b) => b.textContent === 'Cancelar').click();
    expect(getPromptHistory().length).toBe(1);
  });
});
