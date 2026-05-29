// i18nCoverage.test.js — garante que toda chave usada em data-i18n /
// data-i18n-html no HTML existe nos dicionários pt E en (evita vazar a chave
// crua na tela quando o idioma muda).

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { DICT } from '../assets/js/i18n.js';

const read = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');
const files = ['../index.html', '../generator.html', '../manual.html', '../admin.html'];

function keysIn(html) {
  const ks = new Set();
  for (const m of html.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)) ks.add(m[1]);
  return ks;
}

describe('cobertura de i18n', () => {
  for (const f of files) {
    it(`todas as chaves de ${f.replace('../', '')} existem em pt e en`, () => {
      const ks = keysIn(read(f));
      const missingPt = [...ks].filter((k) => !(k in DICT.pt));
      const missingEn = [...ks].filter((k) => !(k in DICT.en));
      expect(missingPt).toEqual([]);
      expect(missingEn).toEqual([]);
    });
  }
});
