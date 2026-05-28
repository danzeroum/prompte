// generators.js — exemplo declarativo de geradores de prompt, em módulo puro
// e testável. Usado pelo playground do manual e como referência para a
// extração incremental da lógica inline das páginas index/generator.

export const generatorTemplates = {
  review: {
    name: 'Revisão + Qualidade',
    fields: ['repo', 'arquivo', 'contexto'],
    build: ({ repo = '', arquivo = '', contexto = '' }) =>
      `Analise o repositório ${repo || '<repo>'}, com foco no arquivo ${arquivo || '<arquivo>'}.
Contexto: ${contexto || '<descreva o objetivo>'}

Verifique: legibilidade, aderência a SOLID, cobertura de testes e possíveis vulnerabilidades (OWASP).
Formato da resposta: diffs completos (git apply) + justificativa técnica de cada mudança.`,
  },
  api: {
    name: 'Design de API',
    fields: ['recurso', 'framework', 'contexto'],
    build: ({ recurso = '', framework = '', contexto = '' }) =>
      `Projete uma API REST para o recurso "${recurso || '<recurso>'}" usando ${framework || '<framework>'}.
Contexto: ${contexto || '<descreva o domínio>'}

Avalie: substantivos autoexplicativos, métodos HTTP corretos, versionamento, rate limiting,
observabilidade (logs/métricas/traces) e anti-patterns de API.
Formato da resposta: especificação de endpoints + exemplos de request/response.`,
  },
};

// Constrói o prompt para um template dado um objeto de dados. Lança se o
// template não existir.
export function buildPrompt(templateKey, data = {}) {
  const tpl = generatorTemplates[templateKey];
  if (!tpl) throw new Error(`Template desconhecido: ${templateKey}`);
  return tpl.build(data);
}
