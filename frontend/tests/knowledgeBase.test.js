import {
  EBOOKS,
  knowledgeDomains,
  themes,
  LEVELS,
  domainsForTemplate,
  appendKnowledge,
} from '../assets/js/knowledgeBase.js';
import { buildPrompt } from '../assets/js/generators.js';

describe('knowledgeBase — registro', () => {
  it('todo domínio tem label e rule, e aponta para um ebook existente', () => {
    const ebookIds = new Set(EBOOKS.map((e) => e.id));
    const keys = Object.keys(knowledgeDomains);
    expect(keys.length).toBe(EBOOKS.reduce((n, e) => n + e.insights.length, 0));
    for (const key of keys) {
      const d = knowledgeDomains[key];
      expect(typeof d.label).toBe('string');
      expect(d.label.length).toBeGreaterThan(0);
      expect(typeof d.rule).toBe('string');
      expect(d.rule.length).toBeGreaterThan(0);
      expect(ebookIds.has(d.ebookId)).toBe(true);
    }
  });

  it('as chaves de domínio são únicas', () => {
    const keys = Object.keys(knowledgeDomains);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('themes cobre os 20 ebooks e referencia chaves válidas', () => {
    expect(Object.keys(themes)).toHaveLength(EBOOKS.length);
    for (const ebook of EBOOKS) {
      const theme = themes[ebook.id];
      expect(theme.domains).toHaveLength(ebook.insights.length);
      for (const key of theme.domains) {
        expect(knowledgeDomains[key]).toBeDefined();
      }
    }
  });
});

describe('knowledgeBase — domainsForTemplate', () => {
  it('retorna domínios dos ebooks cujo prompts[] inclui o nome do template', () => {
    // 'Design de API' aparece em e-api, e-arch, e-dados, e-arq2.
    const domains = domainsForTemplate('Design de API');
    expect(domains.length).toBeGreaterThan(0);
    expect(domains.every((k) => knowledgeDomains[k])).toBe(true);
    // inclui ao menos um domínio do ebook de APIs.
    expect(domains.some((k) => k.startsWith('e-api/'))).toBe(true);
  });

  it('retorna [] para nome desconhecido ou vazio', () => {
    expect(domainsForTemplate('Template Inexistente')).toEqual([]);
    expect(domainsForTemplate('')).toEqual([]);
    expect(domainsForTemplate(undefined)).toEqual([]);
  });
});

describe('knowledgeBase — appendKnowledge', () => {
  const base = 'PROMPT BASE';

  it('é no-op quando não há domínios nem contexto extra', () => {
    expect(appendKnowledge(base, {})).toBe(base);
    expect(appendKnowledge(base, { domains: [], extra: '   ' })).toBe(base);
    expect(appendKnowledge(base)).toBe(base);
  });

  it('injeta um bloco numerado com a regra de cada domínio marcado', () => {
    const key = Object.keys(knowledgeDomains)[0];
    const out = appendKnowledge(base, { domains: [key] });
    expect(out.startsWith(base)).toBe(true);
    expect(out).toContain('BASE DE CONHECIMENTO (ebooks):');
    expect(out).toContain(`1. [${knowledgeDomains[key].ebookTitle}] ${knowledgeDomains[key].label}`);
    expect(out).toContain(knowledgeDomains[key].rule);
  });

  it('ignora chaves de domínio inexistentes', () => {
    expect(appendKnowledge(base, { domains: ['nao/existe'] })).toBe(base);
  });

  it('respeita o nível escolhido no cabeçalho do bloco', () => {
    const key = Object.keys(knowledgeDomains)[0];
    const out = appendKnowledge(base, { domains: [key], level: 'academico' });
    expect(out).toContain(LEVELS.academico.label);
    expect(out).toContain(LEVELS.academico.instruction);
  });

  it('usa o nível prático como padrão para nível inválido', () => {
    const key = Object.keys(knowledgeDomains)[0];
    const out = appendKnowledge(base, { domains: [key], level: 'xyz' });
    expect(out).toContain(LEVELS.pratico.label);
  });

  it('anexa o contexto adicional quando fornecido (com trim)', () => {
    const out = appendKnowledge(base, { extra: '  veja o ADR-12  ' });
    expect(out).toContain('CONTEXTO ADICIONAL:');
    expect(out).toContain('veja o ADR-12');
    expect(out).not.toContain('  veja o ADR-12  ');
  });
});

describe('knowledgeBase — não afeta a saída base dos geradores', () => {
  it('buildPrompt continua idêntico (a injeção é externa)', () => {
    const data = { repo: '/app', arquivo: 'auth.ts', contexto: 'pré-deploy' };
    const a = buildPrompt('review', data);
    const b = buildPrompt('review', data);
    expect(a).toBe(b);
    // appendKnowledge sem domínios não altera o prompt-base.
    expect(appendKnowledge(a, {})).toBe(a);
  });
});
