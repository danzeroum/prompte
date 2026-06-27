/* ============================================================
   data.js — catálogo real de templates do repositório danzeroum/prompte
   (portado de assets/js/generators.js e glossary.js).
   Define: GLOSSARY, GROUPS, TEMPLATES (com build() real), INTENTS.
   Tudo exposto em window para o app React consumir.
   ============================================================ */

// ---- helpers (idênticos aos do repo) ----
function bulletList(text) {
  if (!text) return '';
  return text.split('\n').filter((l) => l.trim()).map((l) => '- ' + l.trim()).join('\n');
}
function pickLabels(d, pairs) {
  return pairs.filter(([id]) => d[id]).map(([, label]) => label);
}

// ---- glossário inline (real) ----
const GLOSSARY = {
  WSJF: 'Weighted Shortest Job First — prioriza pelo custo do atraso dividido pelo tamanho do trabalho.',
  INVEST: 'Critério para boas histórias de usuário: Independent, Negotiable, Valuable, Estimable, Small, Testable.',
  Tuckman: 'Modelo de evolução de times: Forming, Storming, Norming, Performing.',
  '5 Vs': 'As cinco dimensões do Big Data: Volume, Velocidade, Variedade, Veracidade e Valor.',
  EAP: 'Estrutura Analítica do Projeto — decomposição hierárquica do escopo em entregas.',
  PMBOK: 'Guia de boas práticas em gestão de projetos publicado pelo PMI.',
  'Monte Carlo': 'Simulação que estima prazos/probabilidades a partir da variabilidade histórica.',
  BDD: 'Behavior-Driven Development — especifica o comportamento no formato Given-When-Then.',
  XAI: 'Explainable AI — técnicas para tornar interpretáveis as decisões de modelos.',
  'Lead Time': 'Tempo entre o pedido e a entrega de um item de trabalho.',
  DoD: 'Definition of Done — critérios que tornam um item realmente concluído.',
  OKR: 'Objectives and Key Results — objetivos com resultados-chave mensuráveis.',
  LGPD: 'Lei Geral de Proteção de Dados — marco brasileiro de privacidade de dados.',
};

// ---- grupos (4 categorias reais) repartidos em 2 modos ----
const GROUPS = [
  { id: 'codigo', label: 'Código direto', mode: 'direto', icon: 'code',
    blurb: 'Cole um trecho, descreva o problema e gere um prompt pronto.' },
  { id: 'repo', label: 'Análise de repositório', mode: 'avancado', icon: 'repo',
    blurb: 'Aponte um repo ou pasta e peça uma análise estruturada.' },
  { id: 'diff', label: 'Melhoria com diff', mode: 'avancado', icon: 'diff',
    blurb: 'Diffs completos, prontos para git apply, no estilo do projeto.' },
  { id: 'dominio', label: 'Domínios avançados', mode: 'avancado', icon: 'domain',
    blurb: 'Lentes de especialista: Cloud, IA/ML, Ágil, OKR, dados e mais.' },
];

// ---- metadados de campo + build() reais (subconjunto curado, totalmente funcional) ----
const TEMPLATES = [
  // ═══════════ CÓDIGO DIRETO ═══════════
  {
    key: 'revisao-correcao', name: 'Revisão e correção', group: 'codigo',
    desc: 'Revisa um trecho de código e devolve correções justificadas, com o código completo ao final.',
    fields: [
      { id: 'rc-linguagem', label: 'Linguagem', type: 'text', placeholder: 'TypeScript, Python, Go…', required: true },
      { id: 'rc-contexto', label: 'Contexto', type: 'text', placeholder: 'O que esse código faz / onde roda', required: true },
      { id: 'rc-codigo', label: 'Código', type: 'textarea', placeholder: 'Cole o trecho aqui', required: true },
      { id: 'rc-problemas', label: 'Problemas que percebo', type: 'textarea', placeholder: 'Um por linha (opcional)' },
    ],
    build(d) {
      let p = `Revise e corrija o seguinte codigo ${d['rc-linguagem']}:\n\n`;
      p += '```\n' + d['rc-codigo'] + '\n```\n\n';
      p += `Contexto: ${d['rc-contexto']}\n`;
      if (d['rc-problemas']) p += `\nProblemas que percebo:\n${bulletList(d['rc-problemas'])}\n`;
      p += `\nPara cada correcao:\n1. Descreva o problema\n2. Justifique a solucao\n3. Forneça o trecho corrigido\n4. Codigo completo corrigido ao final`;
      return p;
    },
  },
  {
    key: 'debug-erros', name: 'Debug de erros', group: 'codigo',
    desc: 'Diagnostica a causa raiz de um erro a partir da mensagem e do comportamento esperado vs. real.',
    fields: [
      { id: 'db-codigo', label: 'Código', type: 'textarea', placeholder: 'O código que gera o erro', required: true },
      { id: 'db-erro', label: 'Erro / mensagem', type: 'textarea', placeholder: 'Stack trace ou mensagem', required: true },
      { id: 'db-esperado', label: 'O que eu esperava', type: 'text', placeholder: 'Comportamento esperado', required: true },
      { id: 'db-atual', label: 'O que acontece', type: 'text', placeholder: 'Comportamento atual', required: true },
    ],
    build(d) {
      let p = `Este codigo esta gerando o seguinte erro:\n\n`;
      p += '```\n' + d['db-codigo'] + '\n```\n\n';
      p += `Erro/mensagem:\n\`\`\`\n${d['db-erro']}\n\`\`\`\n\n`;
      p += `O que eu esperava: ${d['db-esperado']}\n`;
      p += `O que acontece: ${d['db-atual']}\n\n`;
      p += `Faca:\n1. Identifique a causa raiz\n2. Explique o erro em linguagem clara\n3. Forneça o codigo corrigido completo\n4. Sugira como prevenir o problema no futuro`;
      return p;
    },
  },
  {
    key: 'criar-do-zero', name: 'Criar do zero', group: 'codigo',
    desc: 'Gera código novo a partir de requisitos, restrições e estilo desejado.',
    fields: [
      { id: 'cz-tipo', label: 'O que criar', type: 'text', placeholder: 'um componente, um script, uma API…', required: true },
      { id: 'cz-linguagem', label: 'Linguagem', type: 'text', placeholder: 'TypeScript, Python…', required: true },
      { id: 'cz-funcionalidades', label: 'Funcionalidades', type: 'textarea', placeholder: 'Uma por linha', required: true },
      { id: 'cz-restricoes', label: 'Restrições', type: 'textarea', placeholder: 'Uma por linha (opcional)' },
      { id: 'cz-estilo', label: 'Estilo / convenções', type: 'text', placeholder: 'ex.: funcional, sem libs externas' },
    ],
    build(d) {
      let p = `Crie ${d['cz-tipo']} em ${d['cz-linguagem']} com os seguintes requisitos:\n\n`;
      p += `Funcionalidades:\n${bulletList(d['cz-funcionalidades'])}\n`;
      if (d['cz-restricoes']) p += `\nRestricoes:\n${bulletList(d['cz-restricoes'])}\n`;
      if (d['cz-estilo']) p += `\nEstilo: ${d['cz-estilo']}\n`;
      p += `\nEntregue:\n1. Explicacao da solucao escolhida\n2. Codigo completo pronto para uso\n3. Instrucoes de integracao com o projeto\n4. Testes basicos se aplicavel`;
      return p;
    },
  },
  {
    key: 'explicar-codigo', name: 'Explicar código', group: 'codigo',
    desc: 'Explica um trecho de código no nível de detalhe e foco que você escolher.',
    fields: [
      { id: 'ec-linguagem', label: 'Linguagem', type: 'text', placeholder: 'TypeScript, Rust…', required: true },
      { id: 'ec-nivel', label: 'Nível de detalhe', type: 'select', options: ['Iniciante', 'Intermediario', 'Avancado'] },
      { id: 'ec-foco', label: 'Foco', type: 'select', options: ['Visao geral', 'Linha a linha', 'Padroes e arquitetura', 'Algoritmo'] },
      { id: 'ec-codigo', label: 'Código', type: 'textarea', placeholder: 'Cole o trecho', required: true },
    ],
    build(d) {
      let p = `Explique detalhadamente este codigo ${d['ec-linguagem']}:\n\n`;
      p += '```\n' + d['ec-codigo'] + '\n```\n\n';
      p += `Nivel de detalhe: ${d['ec-nivel']}\nFoco em: ${d['ec-foco']}\n\n`;
      p += `Faca:\n1. Visao geral do que o codigo faz\n2. Explicacao linha a linha (ou bloco a bloco)\n3. Conceitos usados (padroes, algoritmos, tecnicas)\n4. Pontos de atencao e possiveis armadilhas`;
      return p;
    },
  },
  {
    key: 'tela-para-github', name: 'Tela para GitHub', group: 'codigo',
    desc: 'Limpa código copiado da tela (indentação, caracteres corrompidos) e prepara para commit.',
    fields: [
      { id: 'tg-linguagem', label: 'Linguagem', type: 'text', placeholder: 'JavaScript…', required: true },
      { id: 'tg-indent', label: 'Indentação', type: 'select', options: ['espacos', 'tabs'] },
      { id: 'tg-indent-size', label: 'Tamanho', type: 'select', options: ['2', '4'] },
      { id: 'tg-codigo', label: 'Código copiado', type: 'textarea', placeholder: 'Cole o que copiou da tela', required: true },
      { id: 'tg-convencao', label: 'Convenções', type: 'text', placeholder: 'ESLint, Prettier… (opcional)' },
    ],
    build(d) {
      let p = `Analise este codigo ${d['tg-linguagem']} que copiei da tela e prepare-o para commit no GitHub:\n\n`;
      p += '```\n' + d['tg-codigo'] + '\n```\n\n';
      p += `Fazer:\n1. Corrigir possiveis problemas de formatacao da copia\n2. Identificar e corrigir caracteres corrompidos\n3. Garantir indentacao correta em ${d['tg-indent']} (${d['tg-indent-size']})\n4. Verificar se ha trechos cortados ou incompletos\n`;
      if (d['tg-convencao']) p += `5. Seguir as convencoes: ${d['tg-convencao']}\n`;
      p += `\nEntregue o codigo corrigido completo, pronto para colar no arquivo e commitar.`;
      return p;
    },
  },
  {
    key: 'melhoria-refatoracao', name: 'Melhoria / refatoração', group: 'codigo',
    desc: 'Refatora um trecho priorizando os eixos que você marcar (performance, legibilidade, segurança…).',
    fields: [
      { id: 'mr-linguagem', label: 'Linguagem', type: 'text', placeholder: 'Python…', required: true },
      { id: 'mr-funcionalidade', label: 'O que esse código faz', type: 'text', placeholder: 'Descreva em uma frase', required: true },
      { id: 'mr-codigo', label: 'Código', type: 'textarea', placeholder: 'Cole o trecho', required: true },
      { id: 'mr-preocupacao', label: 'Maior preocupação', type: 'text', placeholder: 'opcional' },
      { id: 'mr-perf', label: 'Performance', type: 'checkbox' },
      { id: 'mr-legi', label: 'Legibilidade', type: 'checkbox' },
      { id: 'mr-boas', label: 'Boas práticas', type: 'checkbox' },
      { id: 'mr-seg', label: 'Segurança', type: 'checkbox' },
    ],
    build(d) {
      const pr = pickLabels(d, [['mr-perf', 'Performance'], ['mr-legi', 'Legibilidade'], ['mr-boas', 'Boas praticas'], ['mr-seg', 'Seguranca']]);
      let p = `Melhore este codigo ${d['mr-linguagem']}, priorizando:\n${pr.map((x) => '- ' + x).join('\n')}\n\n`;
      p += '```\n' + d['mr-codigo'] + '\n```\n\n';
      p += `Este codigo faz: ${d['mr-funcionalidade']}\n`;
      if (d['mr-preocupacao']) p += `Preocupo-me especialmente com: ${d['mr-preocupacao']}\n`;
      p += `\nEntregue:\n1. Analise dos problemas encontrados\n2. Para cada melhoria: justificativa + trecho antes/depois\n3. Codigo completo melhorado ao final`;
      return p;
    },
  },

  // ═══════════ ANÁLISE DE REPOSITÓRIO ═══════════
  {
    key: 'analise-geral', name: 'Análise geral do repo', group: 'repo',
    desc: 'Varredura completa de um repositório nos aspectos que você escolher, com resumo executivo e recomendações.',
    fields: [
      { id: 'ag-caminho', label: 'Repositório / pasta', type: 'text', placeholder: 'org/repo ou ./src', required: true },
      { id: 'ag-profundidade', label: 'Profundidade', type: 'select', options: ['Visao geral', 'Media', 'Profunda'] },
      { id: 'ag-contexto', label: 'Contexto', type: 'text', placeholder: 'opcional' },
      { id: 'ag-est', label: 'Estrutura e organização', type: 'checkbox' },
      { id: 'ag-qual', label: 'Qualidade do código', type: 'checkbox' },
      { id: 'ag-seg', label: 'Segurança', type: 'checkbox' },
      { id: 'ag-doc', label: 'Documentação', type: 'checkbox' },
      { id: 'ag-dep', label: 'Dependências e vulnerabilidades', type: 'checkbox' },
      { id: 'ag-perf', label: 'Performance e arquitetura', type: 'checkbox' },
      { id: 'ag-test', label: 'Testes e coverage', type: 'checkbox' },
    ],
    build(d) {
      const aspects = pickLabels(d, [['ag-est', 'Estrutura e organizacao'], ['ag-qual', 'Qualidade do codigo'], ['ag-seg', 'Seguranca'], ['ag-doc', 'Documentacao'], ['ag-dep', 'Dependencias e vulnerabilidades'], ['ag-perf', 'Performance e arquitetura'], ['ag-test', 'Testes e coverage']]);
      let p = `Analise o repositorio ${d['ag-caminho']}.\n\nFoque em:\n`;
      aspects.forEach((a, i) => (p += `${i + 1}. ${a}\n`));
      p += `\nNivel de profundidade: ${d['ag-profundidade']}\n`;
      if (d['ag-contexto']) p += `\nContexto: ${d['ag-contexto']}\n`;
      p += `\nEntregue:\n1. Resumo executivo\n2. Analise detalhada por aspecto\n3. Problemas encontrados (classificados por severidade)\n4. Recomendacoes prioritarias`;
      return p;
    },
  },
  {
    key: 'analise-comparativa', name: 'Análise comparativa', group: 'repo',
    desc: 'Compara dois branches ou pastas e mapeia impacto, regressões e riscos antes do merge.',
    fields: [
      { id: 'ac-caminho', label: 'Repositório', type: 'text', placeholder: 'org/repo', required: true },
      { id: 'ac-branchA', label: 'Branch / pasta A', type: 'text', placeholder: 'main', required: true },
      { id: 'ac-branchB', label: 'Branch / pasta B', type: 'text', placeholder: 'feature/x', required: true },
      { id: 'ac-arq', label: 'Mudanças de arquitetura', type: 'checkbox' },
      { id: 'ac-reg', label: 'Regressões potenciais', type: 'checkbox' },
      { id: 'ac-perf', label: 'Impacto de performance', type: 'checkbox' },
      { id: 'ac-api', label: 'Impacto nas rotas/API', type: 'checkbox' },
    ],
    build(d) {
      const aspects = pickLabels(d, [['ac-arq', 'Mudancas de arquitetura'], ['ac-reg', 'Regressoes potenciais'], ['ac-perf', 'Melhorias/pioresias de performance'], ['ac-api', 'Impacto nas rotas/API']]);
      let p = `Compare o estado do repositorio ${d['ac-caminho']} entre:\n- Branch/Pasta A: ${d['ac-branchA']}\n- Branch/Pasta B: ${d['ac-branchB']}\n\nFoque em:\n`;
      aspects.forEach((a, i) => (p += `${i + 1}. ${a}\n`));
      p += `\nEntregue:\n1. Resumo das mudancas\n2. Analise de impacto para cada aspecto\n3. Riscos identificados\n4. Recomendacoes antes do merge`;
      return p;
    },
  },

  // ═══════════ MELHORIA COM DIFF ═══════════
  {
    key: 'diff-react', name: 'Refatoração React (diff)', group: 'diff',
    desc: 'Refatora um componente React/Vue gerando o diff completo, no padrão do projeto.',
    fields: [
      { id: 'dr-repo', label: 'Repositório', type: 'text', placeholder: 'org/repo', required: true },
      { id: 'dr-comp', label: 'Componente', type: 'text', placeholder: 'src/Button.tsx', required: true },
      { id: 'dr-framework', label: 'Framework', type: 'select', options: ['React', 'Next.js', 'Vue', 'Svelte'] },
      { id: 'dr-estilo', label: 'Estilo', type: 'select', options: ['CSS Modules', 'Tailwind', 'styled-components', 'CSS puro'] },
      { id: 'dr-estado', label: 'Estado', type: 'select', options: ['useState/hooks', 'Redux', 'Zustand', 'Context'] },
      { id: 'dr-logica', label: 'Separar lógica de apresentação', type: 'checkbox' },
      { id: 'dr-hooks', label: 'Extrair hooks customizados', type: 'checkbox' },
      { id: 'dr-tipo', label: 'Melhorar tipagem TypeScript', type: 'checkbox' },
      { id: 'dr-rend', label: 'Otimizar re-renders', type: 'checkbox' },
      { id: 'dr-a11y', label: 'Acessibilidade (a11y)', type: 'checkbox' },
      { id: 'dr-error', label: 'Error boundaries', type: 'checkbox' },
    ],
    build(d) {
      const foco = pickLabels(d, [['dr-logica', 'Separar logica de apresentacao'], ['dr-hooks', 'Extrair hooks customizados'], ['dr-tipo', 'Melhorar tipagem TypeScript'], ['dr-rend', 'Otimizar re-renders'], ['dr-a11y', 'Acessibilidade (a11y)'], ['dr-error', 'Error boundaries']]);
      let p = `Analise e melhore o componente ${d['dr-comp']} no repositorio ${d['dr-repo']}.\n\n`;
      p += `CONTEXTO DO PROJETO:\n- Framework: ${d['dr-framework']}\n- Estilo: ${d['dr-estilo']}\n- Gerenciamento de estado: ${d['dr-estado']}\n\n`;
      p += `TAREFA:\n1. Leia o componente e seus filhos/dependencias\n2. Compare com outros componentes do projeto para identificar padroes de estrutura, naming, styling e hooks\n3. Gere o diff completo refatorado\n\nFOCO ESPECIFICO:\n`;
      foco.forEach((f) => (p += `[x] ${f}\n`));
      p += `\nFORMATO DE RESPOSTA:\n1. Analise: problemas encontrados com severidade\n2. Diff completo do componente refatorado\n3. Diffs de arquivos auxiliares (hooks, tipos, utils) se criados\n4. Nota sobre impacto nos componentes pais/filhos`;
      return p;
    },
  },
  {
    key: 'diff-performance', name: 'Foco em performance (diff)', group: 'diff',
    desc: 'Caça gargalos de performance num arquivo e entrega diffs prontos, sem sacrificar legibilidade.',
    fields: [
      { id: 'dp-repo', label: 'Repositório', type: 'text', placeholder: 'org/repo', required: true },
      { id: 'dp-arquivo', label: 'Arquivo', type: 'text', placeholder: 'src/query.ts', required: true },
      { id: 'dp-freq', label: 'Frequência de execução', type: 'select', options: ['Hot path (alta)', 'Media', 'Esporadica'] },
      { id: 'dp-volume', label: 'Volume esperado', type: 'text', placeholder: 'ex.: 10k req/min (opcional)' },
      { id: 'dp-gargalo', label: 'Gargalo percebido', type: 'text', placeholder: 'opcional' },
    ],
    build(d) {
      let p = `Analise o arquivo ${d['dp-arquivo']} no repositorio ${d['dp-repo']} com FOCO EM PERFORMANCE.\n\nCONTEXTO:\n- Execucao: ${d['dp-freq']}\n`;
      if (d['dp-volume']) p += `- Volume esperado: ${d['dp-volume']}\n`;
      if (d['dp-gargalo']) p += `- Gargalo percebido: ${d['dp-gargalo']}\n`;
      p += `\nTAREFA:\n1. Identifique gargalos de performance\n2. Para cada gargalo:\n   - Causa raiz\n   - Impacto estimado\n   - Solucao proposta\n   - Codigo antes → depois\n3. Gere diffs completos para aplicacao imediata\n\nREGRAS:\n- Nao sacrificar legibilidade por micro-otimizacoes\n- Manter compatibilidade com a interface existente\n- Priorizar mudancas com maior impacto/complexidade\n\nFORMATO DE RESPOSTA:\n1. Gargalos identificados (ranked por impacto)\n2. Para cada mudanca: causa raiz, solucao, estimativa de ganho, diff\n3. Mudancas que exigem mais investigacao`;
      return p;
    },
  },
  {
    key: 'diff-canivete', name: 'Canivete suíço (diff)', group: 'diff',
    desc: 'Análise ampla de um escopo com diffs completos para tudo que precisa mudar.',
    fields: [
      { id: 'dc-repo', label: 'Repositório', type: 'text', placeholder: 'org/repo', required: true },
      { id: 'dc-escopo', label: 'Escopo', type: 'text', placeholder: 'arquivos/diretórios (vazio = repo inteiro)' },
      { id: 'dc-tipo', label: 'Tipo de melhoria', type: 'select', options: ['Geral', 'Seguranca', 'Performance', 'Legibilidade', 'Arquitetura'] },
      { id: 'dc-contexto', label: 'Contexto', type: 'textarea', placeholder: 'opcional' },
    ],
    build(d) {
      let p = `Faça uma analise completa e gere diffs prontos para aplicar no repositorio ${d['dc-repo']}.\n\nESCOPO:\n- Arquivos/Diretorios: ${d['dc-escopo'] || 'repo inteiro'}\n- Tipo de melhoria: ${d['dc-tipo']}\n`;
      if (d['dc-contexto']) p += `\nCONTEXTO:\n${d['dc-contexto']}\n`;
      p += `\nTAREFA:\n1. Analisar profundamente o codigo E a arquitetura ao redor\n2. Entender os padroes do projeto lendo arquivos vizinhos e configs\n3. Identificar TODOS os problemas na area solicitada\n4. Gerar diffs COMPLETOS para cada arquivo que precisa mudar\n5. Garantir que o codigo gerado seja COERENTE com o restante do projeto\n\nOBRIGATORIO NA RESPOSTA:\n[x] Resumo executivo das mudancas\n[x] Justificativa para CADA mudanca\n[x] Diff completo de CADA arquivo (pronto para git apply)\n[x] Riscos e cuidados ao aplicar`;
      return p;
    },
  },

  // ═══════════ DOMÍNIOS AVANÇADOS ═══════════
  {
    key: 'ia-ml-review', name: 'IA / Machine Learning', group: 'dominio',
    desc: 'Lente de IA/ML: avalia viés, qualidade de dados, overfitting, explicabilidade (XAI) e conformidade LGPD.',
    fields: [
      { id: 'ia-repo', label: 'Repositório', type: 'text', placeholder: 'org/repo', required: true },
      { id: 'ia-arquivo', label: 'Arquivo / módulo', type: 'text', placeholder: 'train.py', required: true },
      { id: 'ia-tipo', label: 'Tipo de modelo', type: 'select', options: ['Classificacao', 'Regressao', 'NLP/LLM', 'Visao', 'Recomendacao'] },
      { id: 'ia-contexto', label: 'Contexto', type: 'textarea', placeholder: 'O que o modelo faz, dados usados…', required: true },
      { id: 'ia-vies', label: 'Viés e ética nos dados', type: 'checkbox' },
      { id: 'ia-qual', label: 'Qualidade dos dados', type: 'checkbox' },
      { id: 'ia-over', label: 'Overfitting / generalização', type: 'checkbox' },
      { id: 'ia-sec', label: 'Segurança adversarial', type: 'checkbox' },
      { id: 'ia-exp', label: 'Explicabilidade (XAI)', type: 'checkbox' },
      { id: 'ia-lgpd', label: 'Conformidade LGPD', type: 'checkbox' },
    ],
    build(d) {
      const aspects = pickLabels(d, [['ia-vies', 'Vies e Etica nos Dados'], ['ia-qual', 'Qualidade dos Dados'], ['ia-over', 'Overfitting / Generalizacao'], ['ia-sec', 'Seguranca Adversarial'], ['ia-exp', 'Explicabilidade (XAI)'], ['ia-lgpd', 'Conformidade LGPD']]);
      let p = `Revise o codigo do repositorio ${d['ia-repo']}, com foco em ${d['ia-arquivo']}, sob a perspectiva de IA/ML.\n\nCONTEXTO: ${d['ia-contexto']}\nTIPO DE MODELO: ${d['ia-tipo']}\n\nDOMINIO: Inteligencia Artificial / Machine Learning\nVerifique os seguintes aspectos:\n`;
      aspects.forEach((a, i) => (p += `${i + 1}. ${a}\n`));
      p += `\nREGRAS OBRIGATORIAS:\n- Vies e Etica: representatividade dos dados, vies de selecao e de atributo\n- Overfitting: separacao treino/teste, cross-validation, regularizacao\n- Explicabilidade: SHAP, LIME, feature importance, decisoes auditaveis\n- LGPD: consentimento, direito ao esquecimento, anonimizacao\n- Monitoramento: drift detection, retraining triggers\n\nFORMATO DE RESPOSTA:\n1. Diagnostico completo do pipeline de ML com severidade\n2. Analise de vies e etica com metricas\n3. Recomendacoes de mitigacao por risco\n4. Diffs de correcao para problemas criticos`;
      return p;
    },
  },
  {
    key: 'metricas-okr', name: 'Métricas / OKR', group: 'dominio',
    desc: 'Lente de OKR e métricas de fluxo: Lead Time, WSJF, previsibilidade por Monte Carlo e output vs. outcome.',
    fields: [
      { id: 'mo-repo', label: 'Repositório', type: 'text', placeholder: 'org/repo', required: true },
      { id: 'mo-contexto', label: 'Contexto / OKRs do time', type: 'textarea', placeholder: 'Objetivos e key results atuais', required: true },
      { id: 'mo-okr', label: 'OKR (output vs outcome)', type: 'checkbox' },
      { id: 'mo-fluxo', label: 'Fluxo (Lead Time, Throughput, WIP)', type: 'checkbox' },
      { id: 'mo-eff', label: 'Eficiência vs eficácia', type: 'checkbox' },
      { id: 'mo-prev', label: 'Previsibilidade (Monte Carlo)', type: 'checkbox' },
      { id: 'mo-little', label: 'Lei de Little', type: 'checkbox' },
    ],
    build(d) {
      const aspects = pickLabels(d, [['mo-okr', 'OKR (Output vs Outcome)'], ['mo-fluxo', 'Fluxo (Lead Time, Throughput, WIP)'], ['mo-eff', 'Eficiencia vs Eficacia'], ['mo-prev', 'Previsibilidade (Monte Carlo)'], ['mo-little', 'Lei de Little']]);
      let p = `Analise o repositorio ${d['mo-repo']} sob a lente de metricas e OKRs.\n\nCONTEXTO / OKRs DO TIME: ${d['mo-contexto']}\n\nDOMINIO: Metricas e OKRs para Times de Tecnologia\nVerifique as seguintes metricas:\n`;
      aspects.forEach((a, i) => (p += `${i + 1}. ${a}\n`));
      p += `\nREGRAS OBRIGATORIAS:\n- OKR: diferencie outputs (atividades) de outcomes (resultados de negocio)\n- Fluxo: calcule Lead Time, Throughput, Cycle Time e WIP a partir do git history\n- Lei de Little: use para estimar tempo de entrega\n- Previsibilidade: simulacao Monte Carlo sobre estimativas historicas\n\nFORMATO DE RESPOSTA:\n1. Dashboard de metricas calculadas\n2. Avaliacao dos OKRs (bem definidos? mensuraveis?)\n3. Analise de fluxo com gargalos\n4. Sugestao de OKRs refinados`;
      return p;
    },
  },
  {
    key: 'cloud-review', name: 'Cloud / Infra', group: 'dominio',
    desc: 'Lente de cloud: IAM, segredos, IaC, containers e compliance (LGPD, NIST, BACEN), com otimização de custo.',
    fields: [
      { id: 'cl-repo', label: 'Repositório', type: 'text', placeholder: 'org/repo', required: true },
      { id: 'cl-arquivo', label: 'Arquivo / módulo', type: 'text', placeholder: 'main.tf, k8s/…', required: true },
      { id: 'cl-provider', label: 'Provedor', type: 'select', options: ['AWS', 'GCP', 'Azure', 'Multi-cloud'] },
      { id: 'cl-contexto', label: 'Contexto', type: 'textarea', placeholder: 'O que essa infra provisiona', required: true },
      { id: 'cl-sec', label: 'Segurança (IAM, criptografia)', type: 'checkbox' },
      { id: 'cl-iac', label: 'Infra as Code (Terraform/CFN)', type: 'checkbox' },
      { id: 'cl-cont', label: 'Containers (Docker/K8s)', type: 'checkbox' },
      { id: 'cl-comp', label: 'Compliance (LGPD, NIST, BACEN)', type: 'checkbox' },
    ],
    build(d) {
      const aspects = pickLabels(d, [['cl-sec', 'Seguranca (IAM, criptografia, flags)'], ['cl-iac', 'Infra as Code (Terraform/CloudFormation)'], ['cl-cont', 'Containers (Docker/K8s)'], ['cl-comp', 'Compliance (LGPD, NIST, BACEN)']]);
      let p = `Analise detalhadamente o repositorio ${d['cl-repo']}, com foco em ${d['cl-arquivo']}.\n\nCONTEXTO: ${d['cl-contexto']}\nPROVEDOR DE NUVEM: ${d['cl-provider']}\n\nDOMINIO: Cloud Computing\nVerifique os seguintes aspectos:\n`;
      aspects.forEach((a, i) => (p += `${i + 1}. ${a}\n`));
      p += `\nREGRAS OBRIGATORIAS:\n- Modelo de responsabilidade compartilhada (Shared Responsibility Model)\n- Configuracoes de seguranca (IAM, security groups, flags inseguras)\n- Conformidade com LGPD, NIST CSF e BACEN 4.658 (se aplicavel)\n- Cost optimization e provisionamento\n- Hardcoding de secrets, chaves ou credenciais\n- Backup e disaster recovery\n- Para IaC: idempotencia, modularizacao e seguranca dos templates\n\nFORMATO DE RESPOSTA:\n1. Diagnostico com severidade (critica | alta | media | baixa)\n2. Recomendacoes por area (seguranca, custo, performance, compliance)\n3. Diff completo para cada correcao\n4. Roadmap priorizado por impacto`;
      return p;
    },
  },
  {
    key: 'agile-review', name: 'Métodos ágeis', group: 'dominio',
    desc: 'Lente ágil: BDD, métricas de fluxo (Lead Time), priorização por WSJF e a Definition of Done (DoD).',
    fields: [
      { id: 'agl-repo', label: 'Repositório', type: 'text', placeholder: 'org/repo', required: true },
      { id: 'agl-arquivo', label: 'Arquivo / módulo', type: 'text', placeholder: 'opcional' },
      { id: 'agl-framework', label: 'Framework ágil', type: 'select', options: ['Scrum', 'Kanban', 'SAFe', 'XP'] },
      { id: 'agl-contexto', label: 'Contexto da sprint/projeto', type: 'textarea', placeholder: 'opcional' },
      { id: 'agl-bdd', label: 'BDD (Given-When-Then)', type: 'checkbox' },
      { id: 'agl-fluxo', label: 'Métricas de fluxo (Lead Time)', type: 'checkbox' },
      { id: 'agl-wsjf', label: 'Priorização por valor (WSJF)', type: 'checkbox' },
      { id: 'agl-dod', label: 'Definition of Done', type: 'checkbox' },
    ],
    build(d) {
      const aspects = pickLabels(d, [['agl-bdd', 'BDD (Given-When-Then)'], ['agl-fluxo', 'Metricas de Fluxo (Lead Time)'], ['agl-wsjf', 'Priorizacao por Valor (WSJF)'], ['agl-dod', 'Definition of Done']]);
      let p = `Revise o repositorio ${d['agl-repo']}${d['agl-arquivo'] ? ' com foco em ' + d['agl-arquivo'] : ''}, sob a perspectiva de metodos ageis.\n\nCONTEXTO DA SPRINT/PROJETO: ${d['agl-contexto']}\nFRAMEWORK AGIL: ${d['agl-framework']}\n\nDOMINIO: Metodos Ageis\nVerifique os seguintes aspectos:\n`;
      aspects.forEach((a, i) => (p += `${i + 1}. ${a}\n`));
      p += `\nREGRAS OBRIGATORIAS:\n- Testes no padrao BDD (Given-When-Then) quando aplicavel\n- Metricas de fluxo: Lead Time, Throughput, Cycle Time, WIP\n- Priorizacao por WSJF (Weighted Shortest Job First)\n- Definition of Done respeitada\n\nFORMATO DE RESPOSTA:\n1. Avaliacao da maturidade agil do repositorio\n2. Problemas com severidade\n3. Metricas de fluxo calculaveis a partir do git history\n4. Recomendacoes de melhoria nos processos ageis`;
      return p;
    },
  },
  {
    key: 'requisitos-review', name: 'Eng. de requisitos', group: 'dominio',
    desc: 'Lente de requisitos: rastreabilidade requisito→código→teste e histórias avaliadas pelo critério INVEST.',
    fields: [
      { id: 'rq-repo', label: 'Repositório', type: 'text', placeholder: 'org/repo', required: true },
      { id: 'rq-arquivo', label: 'Arquivo / módulo', type: 'text', placeholder: 'opcional' },
      { id: 'rq-contexto', label: 'Requisito original / contexto', type: 'textarea', placeholder: 'A especificação que deveria estar implementada', required: true },
      { id: 'rq-inv', label: 'Histórias de usuário (INVEST)', type: 'checkbox' },
      { id: 'rq-nf', label: 'Requisitos não funcionais', type: 'checkbox' },
      { id: 'rq-sla', label: 'SLAs e métricas de aceite', type: 'checkbox' },
    ],
    build(d) {
      const aspects = pickLabels(d, [['rq-inv', 'Historias de Usuario (INVEST)'], ['rq-nf', 'Requisitos Nao Funcionais'], ['rq-sla', 'SLAs e Metricas de Aceite']]);
      let p = `Analise o repositorio ${d['rq-repo']}${d['rq-arquivo'] ? ', com foco em ' + d['rq-arquivo'] : ''}, verificando a implementacao de requisitos.\n\nREQUISITO ORIGINAL / CONTEXTO:\n${d['rq-contexto']}\n\nDOMINIO: Engenharia de Requisitos\nVerifique os seguintes aspectos:\n`;
      aspects.forEach((a, i) => (p += `${i + 1}. ${a}\n`));
      p += `\nREGRAS OBRIGATORIAS:\n- Compare o requisito original com o codigo implementado\n- Identifique gaps entre especificacao e implementacao\n- Historias seguem o criterio INVEST (Independent, Negotiable, Valuable, Estimable, Small, Testable)\n- Rastreabilidade: cada requisito com codigo + teste correspondente\n\nFORMATO DE RESPOSTA:\n1. Matriz de rastreabilidade (requisito → codigo → teste)\n2. Gaps com severidade\n3. Historias avaliadas pelo criterio INVEST\n4. Diffs de correcao para gaps criticos`;
      return p;
    },
  },
  {
    key: 'gestao-projeto', name: 'Gestão de projetos', group: 'dominio',
    desc: 'Lente PMBOK/híbrido: escopo via EAP, matriz de riscos, stakeholders e Project Charter.',
    fields: [
      { id: 'gp-repo', label: 'Repositório', type: 'text', placeholder: 'org/repo', required: true },
      { id: 'gp-modelo', label: 'Modelo de gestão', type: 'select', options: ['PMBOK', 'Hibrido', 'Agil', 'Cascata'] },
      { id: 'gp-contexto', label: 'Contexto do projeto', type: 'textarea', placeholder: 'opcional' },
      { id: 'gp-escopo', label: 'Escopo e EAP', type: 'checkbox' },
      { id: 'gp-risco', label: 'Gerenciamento de riscos', type: 'checkbox' },
      { id: 'gp-stake', label: 'Stakeholders e comunicação', type: 'checkbox' },
      { id: 'gp-charter', label: 'Project Charter', type: 'checkbox' },
    ],
    build(d) {
      const aspects = pickLabels(d, [['gp-escopo', 'Escopo e EAP'], ['gp-risco', 'Gerenciamento de Riscos'], ['gp-stake', 'Stakeholders e Comunicacao'], ['gp-charter', 'Project Charter']]);
      let p = `Analise o projeto no repositorio ${d['gp-repo']} sob a perspectiva de gestao de projetos.\n\nCONTEXTO DO PROJETO: ${d['gp-contexto']}\nMODELO DE GESTAO: ${d['gp-modelo']}\n\nDOMINIO: Gestao de Projetos (PMBOK / Hibrido)\nVerifique os seguintes aspectos:\n`;
      aspects.forEach((a, i) => (p += `${i + 1}. ${a}\n`));
      p += `\nREGRAS OBRIGATORIAS:\n- Escopo: a EAP (Estrutura Analitica do Projeto) refletida na estrutura do repo\n- Riscos: probabilidade x impacto, com mitigacoes\n- Stakeholders: matriz Poder/Interesse\n- Project Charter: objetivos, escopo, entregas e restricoes documentados\n\nFORMATO DE RESPOSTA:\n1. Diagnostico de maturidade em gestao\n2. Matriz de riscos (probabilidade x impacto)\n3. Mapa de stakeholders\n4. Plano de acao priorizado`;
      return p;
    },
  },
  {
    key: 'squads-review', name: 'Tech squads', group: 'dominio',
    desc: 'Lente de times: estrutura multifuncional, silos de conhecimento e a fase do time pelo modelo de Tuckman.',
    fields: [
      { id: 'sq-repo', label: 'Repositório', type: 'text', placeholder: 'org/repo', required: true },
      { id: 'sq-tam', label: 'Tamanho do squad', type: 'select', options: ['3-5', '6-9', '10+'] },
      { id: 'sq-contexto', label: 'Perfil do time', type: 'textarea', placeholder: 'opcional' },
      { id: 'sq-estrut', label: 'Estrutura multifuncional', type: 'checkbox' },
      { id: 'sq-tuck', label: 'Modelo de Tuckman', type: 'checkbox' },
      { id: 'sq-lider', label: 'Liderança positiva', type: 'checkbox' },
    ],
    build(d) {
      const aspects = pickLabels(d, [['sq-estrut', 'Estrutura Multifuncional'], ['sq-tuck', 'Modelo de Tuckman'], ['sq-lider', 'Lideranca Positiva']]);
      let p = `Revise o repositorio ${d['sq-repo']} sob a perspectiva de dinamica de squads.\n\nCONTEXTO / PERFIL DO TIME: ${d['sq-contexto']}\nTAMANHO DO SQUAD: ${d['sq-tam']}\n\nDOMINIO: Tech Squads e Dinamica de Times\nVerifique os seguintes aspectos:\n`;
      aspects.forEach((a, i) => (p += `${i + 1}. ${a}\n`));
      p += `\nREGRAS OBRIGATORIAS:\n- Estrutura multifuncional: skills compativeis com um squad completo\n- Modelo de Tuckman: identifique a fase (Forming, Storming, Norming, Performing) pelos padroes de commit e PR\n- Silos de conhecimento (concentracao de commits em poucas pessoas)\n- Onboarding e conhecimento compartilhado\n\nFORMATO DE RESPOSTA:\n1. Perfil do squad baseado no repositorio\n2. Mapa de competencias (existentes vs necessarias)\n3. Diagnostico da fase do time (Tuckman)\n4. Recomendacoes para amadurecimento`;
      return p;
    },
  },
];

// ---- portas de entrada (intents) da home ----
const INTENTS = [
  { id: 'codigo', title: 'Revisar ou corrigir um trecho', sub: 'Cole código e gere um prompt em segundos', mode: 'direto', group: 'codigo', template: 'revisao-correcao', icon: 'code', tag: '6 modelos' },
  { id: 'repo', title: 'Analisar um repositório inteiro', sub: 'Varredura estruturada com severidade', mode: 'avancado', group: 'repo', template: 'analise-geral', icon: 'repo', tag: '2 modelos' },
  { id: 'diff', title: 'Gerar um diff pronto pra aplicar', sub: 'Patches no estilo do seu projeto', mode: 'avancado', group: 'diff', template: 'diff-react', icon: 'diff', tag: '3 modelos' },
  { id: 'dominio', title: 'Aplicar uma lente de especialista', sub: 'Cloud · IA/ML · Ágil · OKR · dados…', mode: 'avancado', group: 'dominio', template: 'ia-ml-review', icon: 'domain', tag: '7 lentes' },
];

window.PROMPTE = { GLOSSARY, GROUPS, TEMPLATES, INTENTS };
