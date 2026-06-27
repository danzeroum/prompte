// i18nUntranslated.test.js — rede de segurança contra português vazando para o
// dicionário `en`. O i18nCoverage só garante que a CHAVE existe nos dois idiomas;
// este teste garante que o VALOR em `en` não contém marcadores de português.
// A lista é heurística (tokens de alto sinal, sem colisão com inglês); não prova
// tradução perfeita, mas pega regressões comuns ao adicionar uma chave nova.

import { DICT } from '../assets/js/i18n.js';

const PT_MARKERS = [
  'codigo',
  'código',
  'usuario',
  'usuário',
  'você',
  'voce',
  'descreva',
  'diretorios',
  'diretórios',
  'entregaveis',
  'entregáveis',
  ' ou ',
  'cole o ',
  'cole a ',
  'cole seu ',
  'historia de',
  'história de',
  'autenticacao',
  'autenticação',
  'documentacao',
  'documentação',
  'classificacao',
  'migracao',
  'migração',
  'registros',
  'semanas',
  'pagamentos',
];

describe('valores `en` não contêm português', () => {
  for (const [key, val] of Object.entries(DICT.en)) {
    it(`${key} está em inglês`, () => {
      const low = String(val).toLowerCase();
      const hit = PT_MARKERS.find((m) => low.includes(m));
      expect(hit ? `${key}: "${val}" contém marcador PT "${hit.trim()}"` : null).toBeNull();
    });
  }
});
