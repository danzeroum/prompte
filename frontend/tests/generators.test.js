import { buildPrompt, generatorTemplates } from '../assets/js/generators.js';

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

  it('expõe os templates esperados', () => {
    expect(Object.keys(generatorTemplates)).toEqual(expect.arrayContaining(['review', 'api']));
  });

  it('lança erro para template desconhecido', () => {
    expect(() => buildPrompt('inexistente', {})).toThrow(/desconhecido/i);
  });
});
