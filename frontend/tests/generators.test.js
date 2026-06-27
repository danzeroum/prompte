import {
  buildPrompt,
  generatorTemplates,
  templatesForMode,
  collectFormData,
} from '../assets/js/generators.js';
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

  it('templatesForMode separa Direto (6) de Avançado (19) e exclui playground', () => {
    const direto = templatesForMode('direto');
    const avancado = templatesForMode('avancado');
    expect(direto).toEqual([
      'revisao-correcao',
      'melhoria-refatoracao',
      'tela-para-github',
      'debug-erros',
      'criar-do-zero',
      'explicar-codigo',
    ]);
    expect(avancado).toHaveLength(19);
    // Playground (review/api) e os gen-* não têm `mode` → fora dos dois modos.
    expect(direto).not.toContain('review');
    expect(avancado).not.toContain('gen-review');
    // Ordem de declaração preservada: análise de repo vem antes dos diffs.
    expect(avancado.indexOf('analise-geral')).toBeLessThan(avancado.indexOf('diff-arquivo'));
  });

  it('gen-review usa ids grv-* (sem colidir com rq-* de requisitos-review)', () => {
    const ids = generatorTemplates['gen-review'].fields.map((f) => f.id);
    expect(ids).toContain('grv-repo');
    expect(ids).not.toContain('rq-repo');
    // requisitos-review (um dos 25) mantém rq-repo — não pode colidir.
    expect(generatorTemplates['requisitos-review'].fields.map((f) => f.id)).toContain('rq-repo');
  });

  it('collectFormData escopa ao painel (ids iguais em painéis diferentes)', () => {
    document.body.innerHTML = `
      <div id="panel-a"><input id="grv-repo" value="do-painel-A"></div>
      <div id="panel-b"><input id="grv-repo" value="do-painel-B"></div>`;
    const a = collectFormData('gen-review', document.getElementById('panel-a'));
    const b = collectFormData('gen-review', document.getElementById('panel-b'));
    expect(a['grv-repo']).toBe('do-painel-A');
    expect(b['grv-repo']).toBe('do-painel-B');
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
      data[id] = mode === 'empty' ? '' : `  linha-um ${id}\n  linha-dois ${id}  `;
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
