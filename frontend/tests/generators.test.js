import { buildPrompt, generatorTemplates } from '../assets/js/generators.js';
import { originalGenerators } from './fixtures/generators-original.js';

describe('generators', () => {
  it('constrói o prompt de review com os dados fornecidos', () => {
    const out = buildPrompt('review', { repo: '/app', arquivo: 'auth.ts', contexto: 'pré-deploy' });
    expect(out).toContain('/app');
    expect(out).toContain('auth.ts');
    expect(out).toContain('pré-deploy');
    expect(out).toContain('SOLID');
  });

  it('usa placeholders quando faltam dados', () => {
    const out = buildPrompt('review', {});
    expect(out).toContain('<repo>');
    expect(out).toContain('<arquivo>');
  });

  it('expõe os 35 templates migrados + os exemplos do playground', () => {
    const keys = Object.keys(generatorTemplates);
    expect(keys).toEqual(expect.arrayContaining(['review', 'api']));
    // Todos os 25 do generator.html + os 10 geradores avançados do index.html.
    expect(keys).toEqual(expect.arrayContaining(Object.keys(originalGenerators)));
    expect(Object.keys(originalGenerators)).toHaveLength(35);
    // Os 10 geradores avançados migrados do index.html.
    expect(keys).toEqual(
      expect.arrayContaining([
        'gen-review',
        'gen-api',
        'gen-arch',
        'gen-security',
        'gen-ux',
        'gen-canivete',
        'gen-cloud',
        'gen-ia',
        'gen-dados',
        'gen-gestao',
      ]),
    );
  });

  it('lança erro para template desconhecido', () => {
    expect(() => buildPrompt('inexistente', {})).toThrow(/desconhecido/i);
  });
});

// ─── Equivalência byte-a-byte com os builders originais (M2 safety net) ───
// Gera dados de teste cobrindo: campos vazios, preenchidos (com espaços para
// validar trim), selects e checkboxes em várias combinações; e confirma que a
// saída de buildPrompt() é idêntica à dos 25 builders originais.

function makeData(fields, mode) {
  const data = {};
  let cbIndex = 0;
  for (const f of fields) {
    const { id, type } = f;
    if (type === 'checkbox') {
      if (mode === 'all') data[id] = true;
      else if (mode === 'none') data[id] = false;
      else data[id] = cbIndex % 2 === 0; // alterna marcados/desmarcados
      cbIndex += 1;
    } else if (type === 'select') {
      data[id] = mode === 'empty' ? '' : `valor-${id}`;
    } else {
      // text / textarea — inclui espaços ao redor para exercitar o trim
      data[id] =
        mode === 'empty' ? '' : `  linha-um ${id}\n  linha-dois ${id}  `;
    }
  }
  return data;
}

const migratedKeys = Object.keys(originalGenerators);
const modes = ['empty', 'all', 'none', 'mixed'];

describe('generators — equivalência com os builders originais', () => {
  for (const key of migratedKeys) {
    const fields = generatorTemplates[key].fields;
    for (const mode of modes) {
      it(`${key} [${mode}] produz saída idêntica à original`, () => {
        const data = makeData(fields, mode);
        expect(buildPrompt(key, data)).toBe(originalGenerators[key](data));
      });
    }
  }
});

describe('generators — snapshots', () => {
  for (const key of migratedKeys) {
    it(`${key} snapshot`, () => {
      const data = makeData(generatorTemplates[key].fields, 'mixed');
      expect(buildPrompt(key, data)).toMatchSnapshot();
    });
  }
});
