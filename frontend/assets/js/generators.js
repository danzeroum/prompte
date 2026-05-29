// generators.js — geradores de prompt declarativos, em módulo puro e testável.
// Cada template declara { name, fields, build }. `fields` lista os campos do
// formulário com seu tipo (text/textarea/select/checkbox); `build(data)` monta
// o prompt a partir de um objeto de dados já normalizado por buildPrompt().
//
// Os 25 templates de código/repositório/diff/avançado foram migrados da lógica
// inline de generator.html para cá (recomendação M2), preservando byte-a-byte a
// saída original. Assim podem ser testados, reusados pelo chat e traduzidos.

// Quebra um texto multilinha em uma lista de bullets "- item" (linhas vazias
// são ignoradas). Mesma lógica do helper inline original.
function bulletList(text) {
  if (!text) return '';
  return text
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => '- ' + l.trim())
    .join('\n');
}

// Dado o objeto de dados e uma lista [id, label], retorna os labels cujos
// checkboxes estão marcados, preservando a ordem da lista (substitui o antigo
// checkedItems([...]).map(map)).
function pickLabels(d, pairs) {
  return pairs.filter(([id]) => d[id]).map(([, label]) => label);
}

export const generatorTemplates = {
  // ─── Playground do manual (exemplos declarativos) ───
  review: {
    name: 'Revisão + Qualidade',
    playground: true,
    fields: ['repo', 'arquivo', 'contexto'],
    build: ({ repo = '', arquivo = '', contexto = '' }) =>
      `Analise o repositório ${repo || '<repo>'}, com foco no arquivo ${arquivo || '<arquivo>'}.
Contexto: ${contexto || '<descreva o objetivo>'}

Verifique: legibilidade, aderência a SOLID, cobertura de testes e possíveis vulnerabilidades (OWASP).
Formato da resposta: diffs completos (git apply) + justificativa técnica de cada mudança.`,
  },
  api: {
    name: 'Design de API',
    playground: true,
    fields: ['recurso', 'framework', 'contexto'],
    build: ({ recurso = '', framework = '', contexto = '' }) =>
      `Projete uma API REST para o recurso "${recurso || '<recurso>'}" usando ${framework || '<framework>'}.
Contexto: ${contexto || '<descreva o domínio>'}

Avalie: substantivos autoexplicativos, métodos HTTP corretos, versionamento, rate limiting,
observabilidade (logs/métricas/traces) e anti-patterns de API.
Formato da resposta: especificação de endpoints + exemplos de request/response.`,
  },

  // ═══ CÓDIGO DIRETO ═══
  'revisao-correcao': {
    name: 'Revisao e Correcao',
    fields: [
      { id: 'rc-linguagem', type: 'text' },
      { id: 'rc-contexto', type: 'text' },
      { id: 'rc-codigo', type: 'textarea' },
      { id: 'rc-problemas', type: 'textarea' },
    ],
    build(d) {
      const lang = d['rc-linguagem'];
      const ctx = d['rc-contexto'];
      const code = d['rc-codigo'];
      const probs = d['rc-problemas'];
      let p = `Revise e corrija o seguinte codigo ${lang}:\n\n`;
      p += '```\n' + code + '\n```\n\n';
      p += `Contexto: ${ctx}\n`;
      if (probs) p += `\nProblemas que percebo:\n${bulletList(probs)}\n`;
      p += `\nPara cada correcao:\n1. Descreva o problema\n2. Justifique a solucao\n3. Forneça o trecho corrigido\n4. Codigo completo corrigido ao final`;
      return p;
    },
  },

  'melhoria-refatoracao': {
    name: 'Melhoria / Refatoracao',
    fields: [
      { id: 'mr-linguagem', type: 'text' },
      { id: 'mr-funcionalidade', type: 'text' },
      { id: 'mr-codigo', type: 'textarea' },
      { id: 'mr-preocupacao', type: 'text' },
      { id: 'mr-perf', type: 'checkbox' },
      { id: 'mr-legi', type: 'checkbox' },
      { id: 'mr-boas', type: 'checkbox' },
      { id: 'mr-seg', type: 'checkbox' },
    ],
    build(d) {
      const lang = d['mr-linguagem'];
      const func = d['mr-funcionalidade'];
      const code = d['mr-codigo'];
      const preoc = d['mr-preocupacao'];
      const pr = pickLabels(d, [
        ['mr-perf', 'Performance'],
        ['mr-legi', 'Legibilidade'],
        ['mr-boas', 'Boas praticas'],
        ['mr-seg', 'Seguranca'],
      ]);
      let p = `Melhore este codigo ${lang}, priorizando:\n${pr.map((x) => '- ' + x).join('\n')}\n\n`;
      p += '```\n' + code + '\n```\n\n';
      p += `Este codigo faz: ${func}\n`;
      if (preoc) p += `Preocupo-me especialmente com: ${preoc}\n`;
      p += `\nEntregue:\n1. Analise dos problemas encontrados\n2. Para cada melhoria: justificativa + trecho antes/depois\n3. Codigo completo melhorado ao final`;
      return p;
    },
  },

  'tela-para-github': {
    name: 'Tela para GitHub',
    fields: [
      { id: 'tg-linguagem', type: 'text' },
      { id: 'tg-indent', type: 'select' },
      { id: 'tg-indent-size', type: 'select' },
      { id: 'tg-codigo', type: 'textarea' },
      { id: 'tg-convencao', type: 'text' },
    ],
    build(d) {
      const lang = d['tg-linguagem'];
      const indent = d['tg-indent'];
      const size = d['tg-indent-size'];
      const code = d['tg-codigo'];
      const conv = d['tg-convencao'];
      let p = `Analise este codigo ${lang} que copiei da tela e prepare-o para commit no GitHub:\n\n`;
      p += '```\n' + code + '\n```\n\n';
      p += `Fazer:\n1. Corrigir possiveis problemas de formatacao da copia\n`;
      p += `2. Identificar e corrigir caracteres corrompidos\n`;
      p += `3. Garantir indentacao correta em ${indent} (${size})\n`;
      p += `4. Verificar se ha trechos cortados ou incompletos\n`;
      if (conv) p += `5. Seguir as convencoes: ${conv}\n`;
      p += `\nEntregue o codigo corrigido completo, pronto para colar no arquivo e commitar.`;
      return p;
    },
  },

  'debug-erros': {
    name: 'Debug de Erros',
    fields: [
      { id: 'db-codigo', type: 'textarea' },
      { id: 'db-erro', type: 'textarea' },
      { id: 'db-esperado', type: 'text' },
      { id: 'db-atual', type: 'text' },
    ],
    build(d) {
      const code = d['db-codigo'];
      const erro = d['db-erro'];
      const esp = d['db-esperado'];
      const atu = d['db-atual'];
      let p = `Este codigo esta gerando o seguinte erro:\n\n`;
      p += '```\n' + code + '\n```\n\n';
      p += `Erro/mensagem:\n\`\`\`\n${erro}\n\`\`\`\n\n`;
      p += `O que eu esperava: ${esp}\n`;
      p += `O que acontece: ${atu}\n\n`;
      p += `Faca:\n1. Identifique a causa raiz\n2. Explique o erro em linguagem clara\n3. Forneça o codigo corrigido completo\n4. Sugira como prevenir o problema no futuro`;
      return p;
    },
  },

  'criar-do-zero': {
    name: 'Criar do Zero',
    fields: [
      { id: 'cz-tipo', type: 'text' },
      { id: 'cz-linguagem', type: 'text' },
      { id: 'cz-funcionalidades', type: 'textarea' },
      { id: 'cz-restricoes', type: 'textarea' },
      { id: 'cz-estilo', type: 'text' },
    ],
    build(d) {
      const tipo = d['cz-tipo'];
      const lang = d['cz-linguagem'];
      const func = d['cz-funcionalidades'];
      const rest = d['cz-restricoes'];
      const est = d['cz-estilo'];
      let p = `Crie ${tipo} em ${lang} com os seguintes requisitos:\n\n`;
      p += `Funcionalidades:\n${bulletList(func)}\n`;
      if (rest) p += `\nRestricoes:\n${bulletList(rest)}\n`;
      if (est) p += `\nEstilo: ${est}\n`;
      p += `\nEntregue:\n1. Explicacao da solucao escolhida\n2. Codigo completo pronto para uso\n3. Instrucoes de integracao com o projeto\n4. Testes basicos se aplicavel`;
      return p;
    },
  },

  'explicar-codigo': {
    name: 'Explicar Codigo',
    fields: [
      { id: 'ec-linguagem', type: 'text' },
      { id: 'ec-nivel', type: 'select' },
      { id: 'ec-foco', type: 'select' },
      { id: 'ec-codigo', type: 'textarea' },
    ],
    build(d) {
      const lang = d['ec-linguagem'];
      const nivel = d['ec-nivel'];
      const foco = d['ec-foco'];
      const code = d['ec-codigo'];
      let p = `Explique detalhadamente este codigo ${lang}:\n\n`;
      p += '```\n' + code + '\n```\n\n';
      p += `Nivel de detalhe: ${nivel}\nFoco em: ${foco}\n\n`;
      p += `Faca:\n1. Visao geral do que o codigo faz\n2. Explicacao linha a linha (ou bloco a bloco)\n3. Conceitos usados (padroes, algoritmos, tecnicas)\n4. Pontos de atencao e possiveis armadilhas`;
      return p;
    },
  },

  // ═══ ANALISE DE REPOSITORIO ═══
  'analise-geral': {
    name: 'Analise Geral do Repo',
    fields: [
      { id: 'ag-caminho', type: 'text' },
      { id: 'ag-profundidade', type: 'select' },
      { id: 'ag-contexto', type: 'text' },
      { id: 'ag-est', type: 'checkbox' },
      { id: 'ag-qual', type: 'checkbox' },
      { id: 'ag-seg', type: 'checkbox' },
      { id: 'ag-doc', type: 'checkbox' },
      { id: 'ag-dep', type: 'checkbox' },
      { id: 'ag-perf', type: 'checkbox' },
      { id: 'ag-test', type: 'checkbox' },
    ],
    build(d) {
      const repo = d['ag-caminho'];
      const prof = d['ag-profundidade'];
      const ctx = d['ag-contexto'];
      const aspects = pickLabels(d, [
        ['ag-est', 'Estrutura e organizacao'],
        ['ag-qual', 'Qualidade do codigo'],
        ['ag-seg', 'Seguranca'],
        ['ag-doc', 'Documentacao'],
        ['ag-dep', 'Dependencias e vulnerabilidades'],
        ['ag-perf', 'Performance e arquitetura'],
        ['ag-test', 'Testes e coverage'],
      ]);
      let p = `Analise o repositorio ${repo}.\n\nFoque em:\n`;
      aspects.forEach((a, i) => (p += `${i + 1}. ${a}\n`));
      p += `\nNivel de profundidade: ${prof}\n`;
      if (ctx) p += `\nContexto: ${ctx}\n`;
      p += `\nEntregue:\n1. Resumo executivo\n2. Analise detalhada por aspecto\n3. Problemas encontrados (classificados por severidade)\n4. Recomendacoes prioritarias`;
      return p;
    },
  },

  'analise-especifica': {
    name: 'Analise Especifica',
    fields: [
      { id: 'ae-caminho', type: 'text' },
      { id: 'ae-area', type: 'text' },
      { id: 'ae-cenario', type: 'select' },
      { id: 'ae-contexto', type: 'textarea' },
      { id: 'ae-lista', type: 'checkbox' },
      { id: 'ae-sugestoes', type: 'checkbox' },
      { id: 'ae-codigo', type: 'checkbox' },
      { id: 'ae-mapadep', type: 'checkbox' },
    ],
    build(d) {
      const repo = d['ae-caminho'];
      const area = d['ae-area'];
      const cena = d['ae-cenario'];
      const ctx = d['ae-contexto'];
      const entre = pickLabels(d, [
        ['ae-lista', 'Lista de problemas com severidade'],
        ['ae-sugestoes', 'Sugestoes de correcao'],
        ['ae-codigo', 'Codigo corrigido pronto'],
        ['ae-mapadep', 'Mapa de dependencias'],
      ]);
      let p = `Analise o repositorio ${repo} com foco especifico em:\n\nArea: ${area}\n`;
      if (cena !== 'personalizado') p += `Cenario: ${cena}\n`;
      if (ctx) p += `\nContexto:\n${ctx}\n`;
      if (entre.length) {
        p += `\nEntregaveis esperados:\n`;
        entre.forEach((e, i) => (p += `${i + 1}. ${e}\n`));
      }
      p += `\nInstrucoes:\n- Leia os arquivos relevantes antes de analisar\n- Compare com outros arquivos do projeto para seguir padroes existentes\n- Seja especifico e pratico nas recomendacoes`;
      return p;
    },
  },

  'analise-comparativa': {
    name: 'Analise Comparativa',
    fields: [
      { id: 'ac-caminho', type: 'text' },
      { id: 'ac-branchA', type: 'text' },
      { id: 'ac-branchB', type: 'text' },
      { id: 'ac-arq', type: 'checkbox' },
      { id: 'ac-reg', type: 'checkbox' },
      { id: 'ac-perf', type: 'checkbox' },
      { id: 'ac-dep', type: 'checkbox' },
      { id: 'ac-schema', type: 'checkbox' },
      { id: 'ac-test', type: 'checkbox' },
      { id: 'ac-api', type: 'checkbox' },
    ],
    build(d) {
      const repo = d['ac-caminho'];
      const bA = d['ac-branchA'];
      const bB = d['ac-branchB'];
      const aspects = pickLabels(d, [
        ['ac-arq', 'Mudancas de arquitetura'],
        ['ac-reg', 'Regressoes potenciais'],
        ['ac-perf', 'Melhorias/pioresias de performance'],
        ['ac-dep', 'Novas dependencias'],
        ['ac-schema', 'Mudancas no schema do BD'],
        ['ac-test', 'Impacto nos testes'],
        ['ac-api', 'Impacto nas rotas/API'],
      ]);
      let p = `Compare o estado do repositorio ${repo} entre:\n`;
      p += `- Branch/Pasta A: ${bA}\n- Branch/Pasta B: ${bB}\n\n`;
      p += `Foque em:\n`;
      aspects.forEach((a, i) => (p += `${i + 1}. ${a}\n`));
      p += `\nEntregue:\n1. Resumo das mudancas\n2. Analise de impacto para cada aspecto\n3. Riscos identificados\n4. Recomendacoes antes do merge`;
      return p;
    },
  },

  'refatoracao-orientada': {
    name: 'Refatoracao Orientada',
    fields: [
      { id: 'ro-caminho', type: 'text' },
      { id: 'ro-area', type: 'text' },
      { id: 'ro-restricoes', type: 'textarea' },
      { id: 'ro-manut', type: 'checkbox' },
      { id: 'ro-perf', type: 'checkbox' },
      { id: 'ro-legi', type: 'checkbox' },
      { id: 'ro-seg', type: 'checkbox' },
      { id: 'ro-todos', type: 'checkbox' },
    ],
    build(d) {
      const repo = d['ro-caminho'];
      const area = d['ro-area'];
      const rest = d['ro-restricoes'];
      const pris = pickLabels(d, [
        ['ro-manut', 'Manutenibilidade'],
        ['ro-perf', 'Performance'],
        ['ro-legi', 'Legibilidade'],
        ['ro-seg', 'Seguranca'],
        ['ro-todos', 'Todas as anteriores'],
      ]);
      let p = `Analise o repositorio ${repo}`;
      if (area) p += `, especificamente ${area}`;
      p += ` e proponha refatoracoes.\n\n`;
      p += `Priorize: ${pris.join(', ')}\n`;
      if (rest) p += `\nRestricoes:\n${bulletList(rest)}\n`;
      p += `\nPara cada problema encontrado, forneça:\n1. Descricao do problema\n2. Severidade (critica | alta | media | baixa)\n3. Codigo corrigido pronto para uso\n\nEntregue diffs completos prontos para aplicar.`;
      return p;
    },
  },

  // ═══ MELHORIA COM DIFF ═══
  'diff-arquivo': {
    name: 'Melhoria de Arquivo (Diff)',
    fields: [
      { id: 'da-repo', type: 'text' },
      { id: 'da-arquivo', type: 'text' },
      { id: 'da-obs', type: 'text' },
      { id: 'da-perf', type: 'checkbox' },
      { id: 'da-legi', type: 'checkbox' },
      { id: 'da-seg', type: 'checkbox' },
      { id: 'da-padr', type: 'checkbox' },
      { id: 'da-anti', type: 'checkbox' },
    ],
    build(d) {
      const repo = d['da-repo'];
      const file = d['da-arquivo'];
      const obs = d['da-obs'];
      const foco = pickLabels(d, [
        ['da-perf', 'Performance'],
        ['da-legi', 'Legibilidade'],
        ['da-seg', 'Seguranca'],
        ['da-padr', 'Padronizacao'],
        ['da-anti', 'Anti-padroes'],
      ]);
      let p = `Analise detalhadamente o arquivo ${file} no repositorio ${repo}.\n\n`;
      p += `TAREFA:\n1. Leia todo o arquivo e entenda seu proposito no contexto da arquitetura\n`;
      p += `2. Identifique problemas de:\n   ${foco.map((f) => '- ' + f).join('\n   ')}\n`;
      p += `3. Gere o diff completo do arquivo corrigido\n\n`;
      if (obs) p += `OBSERVACOES: ${obs}\n\n`;
      p += `REGRAS:\n- Mantenha a mesma interface publica (exports, tipos, contratos)\n- Siga EXATAMENTE os padroes que ja existem no restante do projeto\n- Nao adicione dependencias que nao existem no projeto\n- Cada mudanca deve ter justificativa clara\n- O codigo gerado deve ser indistinguivel do estilo do restante da codebase\n\n`;
      p += `FORMATO DE RESPOSTA:\n1. Resumo das mudancas (bullet points)\n2. Para cada mudanca: justificativa + trecho antes → depois\n3. Diff completo do arquivo (pronto para git apply)\n4. Arquivos adicionais que precisam ser modificados (se houver)`;
      return p;
    },
  },

  'diff-modulo': {
    name: 'Melhoria de Modulo (Diff)',
    fields: [
      { id: 'dm-repo', type: 'text' },
      { id: 'dm-dir', type: 'text' },
      { id: 'dm-contexto', type: 'text' },
      { id: 'dm-ling', type: 'text' },
      { id: 'dm-preoc', type: 'select' },
    ],
    build(d) {
      const repo = d['dm-repo'];
      const dir = d['dm-dir'];
      const ctx = d['dm-contexto'];
      const lang = d['dm-ling'];
      const preoc = d['dm-preoc'];
      let p = `Analise o diretorio ${dir} no repositorio ${repo}.\n\n`;
      p += `CONTEXTO:\n- Esse modulo e responsavel por: ${ctx || '(a ser descoberto pela analise)'}\n`;
      if (lang) p += `- Linguagem/Framework: ${lang}\n`;
      if (preoc) p += `- Me preocupa: ${preoc}\n`;
      p += `\nTAREFA:\n1. Explore TODOS os arquivos do diretorio e suas dependencias internas\n`;
      p += `2. Identifique inconsistencias entre os arquivos do proprio modulo\n`;
      p += `3. Compare os padroes usados aqui com o resto do projeto\n`;
      p += `4. Gere diffs completos para CADA arquivo que precisar de mudanca\n\n`;
      p += `REGRAS OBRIGATORIAS:\n- Preservar TODAS as interfaces publicas do modulo\n- Manter compatibilidade com os consumidores do modulo\n- Seguir as convencoes de estilo do restante da codebase\n- Nao introduzir breaking changes\n- Se precisar de nova dependencia, justificar e verificar conflitos\n\n`;
      p += `FORMATO DE RESPOSTA:\n1. Visao geral: o que esta bom e o que precisa mudar\n2. Mapa de dependencias do modulo\n3. Para cada arquivo alterado: justificativa + diff completo\n4. Testes que precisam ser criados/atualizados (com codigo)\n5. Riscos da mudanca e como mitigar`;
      return p;
    },
  },

  'diff-react': {
    name: 'Refatoracao React (Diff)',
    fields: [
      { id: 'dr-repo', type: 'text' },
      { id: 'dr-comp', type: 'text' },
      { id: 'dr-framework', type: 'select' },
      { id: 'dr-estilo', type: 'select' },
      { id: 'dr-estado', type: 'select' },
      { id: 'dr-logica', type: 'checkbox' },
      { id: 'dr-hooks', type: 'checkbox' },
      { id: 'dr-tipo', type: 'checkbox' },
      { id: 'dr-rend', type: 'checkbox' },
      { id: 'dr-a11y', type: 'checkbox' },
      { id: 'dr-error', type: 'checkbox' },
    ],
    build(d) {
      const repo = d['dr-repo'];
      const comp = d['dr-comp'];
      const fw = d['dr-framework'];
      const st = d['dr-estilo'];
      const est = d['dr-estado'];
      const foco = pickLabels(d, [
        ['dr-logica', 'Separar logica de apresentacao'],
        ['dr-hooks', 'Extrair hooks customizados'],
        ['dr-tipo', 'Melhorar tipagem TypeScript'],
        ['dr-rend', 'Otimizar re-renders'],
        ['dr-a11y', 'Acessibilidade (a11y)'],
        ['dr-error', 'Error boundaries'],
      ]);
      let p = `Analise e melhore o componente ${comp} no repositorio ${repo}.\n\n`;
      p += `CONTEXTO DO PROJETO:\n- Framework: ${fw}\n- Estilo: ${st}\n- Gerenciamento de estado: ${est}\n\n`;
      p += `TAREFA:\n1. Leia o componente e seus filhos/dependencias\n`;
      p += `2. Compare com outros componentes do projeto para identificar padroes de estrutura, naming, styling e hooks\n`;
      p += `3. Gere o diff completo refatorado\n\n`;
      p += `FOCO ESPECIFICO:\n`;
      foco.forEach((f) => (p += `[x] ${f}\n`));
      p += `\nFORMATO DE RESPOSTA:\n1. Analise: problemas encontrados com severidade\n2. Diff completo do componente refatorado\n3. Diffs de arquivos auxiliares (hooks, tipos, utils) se criados\n4. Nota sobre impacto nos componentes pais/filhos`;
      return p;
    },
  },

  'diff-api': {
    name: 'Refatoracao API (Diff)',
    fields: [
      { id: 'di-repo', type: 'text' },
      { id: 'di-arquivo', type: 'text' },
      { id: 'di-framework', type: 'select' },
      { id: 'di-db', type: 'select' },
      { id: 'di-auth', type: 'select' },
      { id: 'di-obs', type: 'text' },
      { id: 'di-val', type: 'checkbox' },
      { id: 'di-err', type: 'checkbox' },
      { id: 'di-sec', type: 'checkbox' },
      { id: 'di-perf', type: 'checkbox' },
      { id: 'di-log', type: 'checkbox' },
      { id: 'di-contr', type: 'checkbox' },
    ],
    build(d) {
      const repo = d['di-repo'];
      const file = d['di-arquivo'];
      const fw = d['di-framework'];
      const db = d['di-db'];
      const auth = d['di-auth'];
      const obs = d['di-obs'];
      const foco = pickLabels(d, [
        ['di-val', 'Validacao de input'],
        ['di-err', 'Tratamento de erros'],
        ['di-sec', 'Seguranca'],
        ['di-perf', 'Performance (N+1, paginacao)'],
        ['di-log', 'Logging e monitoramento'],
        ['di-contr', 'Contratos de resposta'],
      ]);
      let p = `Analise e melhore o endpoint/servico ${file} no repositorio ${repo}.\n\n`;
      p += `CONTEXTO DO PROJETO:\n- Framework: ${fw}\n- Banco de dados: ${db}\n- Autenticacao: ${auth}\n\n`;
      p += `TAREFA:\n1. Leia o arquivo e entenda o fluxo request → response\n`;
      p += `2. Analise:\n   ${foco.map((f) => '- ' + f).join('\n   ')}\n`;
      p += `3. Compare com outros endpoints do projeto para seguir MESMO padrao\n\n`;
      if (obs) p += `OBSERVACOES: ${obs}\n\n`;
      p += `REGRAS:\n- Manter a mesma URL e metodo HTTP\n- Manter o mesmo formato de request/response (ou documentar a mudanca)\n- Seguir EXATAMENTE o padrao de error handling do projeto\n- Seguir EXATAMENTE o padrao de validacao do projeto\n\n`;
      p += `FORMATO DE RESPOSTA:\n1. Diagnostico detalhado com severidade (critica | alta | media | baixa)\n2. Diff completo do arquivo corrigido\n3. Diffs de arquivos auxiliares se necessario\n4. Migration SQL se o schema mudar\n5. Testes atualizados/criados`;
      return p;
    },
  },

  'diff-testes': {
    name: 'Revisao de Testes (Diff)',
    fields: [
      { id: 'dt-repo', type: 'text' },
      { id: 'dt-arquivo', type: 'text' },
      { id: 'dt-framework', type: 'select' },
      { id: 'dt-problemas', type: 'textarea' },
    ],
    build(d) {
      const repo = d['dt-repo'];
      const file = d['dt-arquivo'];
      const fw = d['dt-framework'];
      const prob = d['dt-problemas'];
      let p = `Analise os testes em ${file} no repositorio ${repo}.\n\n`;
      p += `TAREFA:\n1. Leia os testes E o codigo que eles testam\n`;
      p += `2. Identifique:\n   - Testes que nao testam nada util (testes fracos)\n   - Caminhos felizes e tristes nao cobertos\n   - Mocks incorretos ou excessivos\n   - Testes faceis (quebram por mudancas irrelevantes)\n   - Inconsistencia com o padrao de testes do projeto\n`;
      p += `3. Compare com outros testes do projeto para seguir o MESMO estilo\n\n`;
      if (fw !== 'deixe descobrir') p += `Framework de testes: ${fw}\n\n`;
      if (prob) p += `Problemas que percebo:\n${bulletList(prob)}\n\n`;
      p += `FORMATO DE RESPOSTA:\n1. Coverage: o que esta coberto e o que falta\n2. Problemas nos testes atuais\n3. Diff completo dos testes melhorados\n4. Novos testes adicionados (com justificativa do que cobrem)`;
      return p;
    },
  },

  'diff-performance': {
    name: 'Foco em Performance (Diff)',
    fields: [
      { id: 'dp-repo', type: 'text' },
      { id: 'dp-arquivo', type: 'text' },
      { id: 'dp-freq', type: 'select' },
      { id: 'dp-volume', type: 'text' },
      { id: 'dp-gargalo', type: 'text' },
    ],
    build(d) {
      const repo = d['dp-repo'];
      const file = d['dp-arquivo'];
      const freq = d['dp-freq'];
      const vol = d['dp-volume'];
      const garg = d['dp-gargalo'];
      let p = `Analise o arquivo ${file} no repositorio ${repo} com FOCO EM PERFORMANCE.\n\n`;
      p += `CONTEXTO:\n- Execucao: ${freq}\n`;
      if (vol) p += `- Volume esperado: ${vol}\n`;
      if (garg) p += `- Gargalo percebido: ${garg}\n`;
      p += `\nTAREFA:\n1. Identifique gargalos de performance\n`;
      p += `2. Para cada gargalo:\n   - Causa raiz\n   - Impacto estimado\n   - Solucao proposta\n   - Codigo antes → depois\n`;
      p += `3. Gere diffs completos para aplicacao imediata\n\n`;
      p += `REGRAS:\n- Nao sacrificar legibilidade por micro-otimizacoes\n- Manter compatibilidade com a interface existente\n- Priorizar mudancas com maior impacto/complexidade\n\n`;
      p += `FORMATO DE RESPOSTA:\n1. Gargalos identificados (ranked por impacto)\n2. Para cada mudanca: causa raiz, solucao, estimativa de ganho, diff\n3. Mudancas que exigem mais investigacao`;
      return p;
    },
  },

  'diff-canivete': {
    name: 'Canivete Suico (Diff)',
    fields: [
      { id: 'dc-repo', type: 'text' },
      { id: 'dc-escopo', type: 'text' },
      { id: 'dc-tipo', type: 'select' },
      { id: 'dc-contexto', type: 'textarea' },
    ],
    build(d) {
      const repo = d['dc-repo'];
      const esc = d['dc-escopo'];
      const tipo = d['dc-tipo'];
      const ctx = d['dc-contexto'];
      let p = `Faça uma analise completa e gere diffs prontos para aplicar no repositorio ${repo}.\n\n`;
      p += `ESCOPO:\n- Arquivos/Diretorios: ${esc || 'repo inteiro'}\n`;
      p += `- Tipo de melhoria: ${tipo}\n`;
      if (ctx) p += `\nCONTEXTO:\n${ctx}\n`;
      p += `\nTAREFA:\n1. Analisar profundamente o codigo E a arquitetura ao redor\n`;
      p += `2. Entender os padroes do projeto lendo arquivos vizinhos e configs\n`;
      p += `3. Identificar TODOS os problemas na area solicitada\n`;
      p += `4. Gerar diffs COMPLETOS para cada arquivo que precisa mudar\n`;
      p += `5. Garantir que o codigo gerado seja COERENTE com o restante do projeto\n\n`;
      p += `OBRIGATORIO NA RESPOSTA:\n[x] Resumo executivo das mudancas\n[x] Justificativa para CADA mudanca\n[x] Diff completo de CADA arquivo (pronto para git apply)\n[x] Novos arquivos que precisam ser criados (com conteudo completo)\n[x] Arquivos que precisam ser deletados (se houver)\n[x] Dependencias novas (se houver, com justificativa)\n[x] Riscos e cuidados ao aplicar\n[x] Comandos para aplicar as mudancas\n\n`;
      p += `NAO FAZER:\n[ ] Mudancas sem justificativa\n[ ] Breaking changes sem aviso explicito\n[ ] Introduzir padroes diferentes do restante do projeto\n[ ] Adicionar dependencias desnecessarias`;
      return p;
    },
  },

  // ═══ DOMINIOS AVANCADOS ═══
  'cloud-review': {
    name: 'Cloud / Infra Review',
    fields: [
      { id: 'cl-repo', type: 'text' },
      { id: 'cl-arquivo', type: 'text' },
      { id: 'cl-provider', type: 'select' },
      { id: 'cl-contexto', type: 'textarea' },
      { id: 'cl-sec', type: 'checkbox' },
      { id: 'cl-model', type: 'checkbox' },
      { id: 'cl-mig', type: 'checkbox' },
      { id: 'cl-comp', type: 'checkbox' },
      { id: 'cl-iac', type: 'checkbox' },
      { id: 'cl-cont', type: 'checkbox' },
    ],
    build(d) {
      const repo = d['cl-repo'];
      const arquivo = d['cl-arquivo'];
      const provider = d['cl-provider'];
      const ctx = d['cl-contexto'];
      const aspects = pickLabels(d, [
        ['cl-sec', 'Seguranca (IAM, criptografia, flags)'],
        ['cl-model', 'Modelo de servico (SaaS/PaaS/IaaS)'],
        ['cl-mig', 'Preparacao para migracao'],
        ['cl-comp', 'Compliance (LGPD, NIST, BACEN)'],
        ['cl-iac', 'Infra as Code (Terraform/CloudFormation)'],
        ['cl-cont', 'Containers (Docker/K8s)'],
      ]);
      let p = `Analise detalhadamente o repositorio ${repo}, com foco em ${arquivo}.\n\n`;
      p += `CONTEXTO: ${ctx}\n`;
      if (provider) p += `PROVEDOR DE NUVEM: ${provider}\n`;
      p += `\nDOMINIO: Cloud Computing\n`;
      p += `Verifique os seguintes aspectos:\n`;
      aspects.forEach((a, i) => (p += `${i + 1}. ${a}\n`));
      p += `\nREGRAS OBRIGATORIAS:\n`;
      p += `- Avalie o modelo de responsabilidade compartilhada da nuvem (Shared Responsibility Model)\n`;
      p += `- Verifique configuracoes de seguranca (IAM policies, security groups, flags inseguras)\n`;
      p += `- Verifique conformidade com LGPD, NIST CSF e BACEN 4.658 (se aplicavel)\n`;
      p += `- Identifique se recursos estao provisionados de forma otimizada (cost optimization)\n`;
      p += `- Verifique se ha hardcoding de secrets, chaves ou credenciais\n`;
      p += `- Avalie a estrategia de backup e disaster recovery\n`;
      p += `- Verifique se os logs e monitoramento estao configurados adequadamente\n`;
      p += `- Para IaC: valide idempotencia, modularizacao e seguranca dos templates\n\n`;
      p += `FORMATO DE RESPOSTA:\n`;
      p += `1. Diagnostico com severidade (critica | alta | media | baixa)\n`;
      p += `2. Recomendacoes por area (seguranca, custo, performance, compliance)\n`;
      p += `3. Diff completo para cada correcao (se aplicavel)\n`;
      p += `4. Riscos cloud-specific e mitigacoes\n`;
      p += `5. Roadmap de melhorias priorizado por impacto`;
      return p;
    },
  },

  'requisitos-review': {
    name: 'Eng. Requisitos Review',
    fields: [
      { id: 'rq-repo', type: 'text' },
      { id: 'rq-arquivo', type: 'text' },
      { id: 'rq-contexto', type: 'textarea' },
      { id: 'rq-inv', type: 'checkbox' },
      { id: 'rq-nf', type: 'checkbox' },
      { id: 'rq-back', type: 'checkbox' },
      { id: 'rq-proto', type: 'checkbox' },
      { id: 'rq-sla', type: 'checkbox' },
    ],
    build(d) {
      const repo = d['rq-repo'];
      const arquivo = d['rq-arquivo'];
      const ctx = d['rq-contexto'];
      const aspects = pickLabels(d, [
        ['rq-inv', 'Historias de Usuario (INVEST)'],
        ['rq-nf', 'Requisitos Nao Funcionais'],
        ['rq-back', 'Alinhamento com Backlog'],
        ['rq-proto', 'Prototipos e Especificacoes'],
        ['rq-sla', 'SLAs e Metricas de Aceite'],
      ]);
      let p = `Analise o repositorio ${repo}, com foco em ${arquivo}, verificando a implementacao de requisitos.\n\n`;
      p += `REQUISITO ORIGINAL / CONTEXTO:\n${ctx}\n\n`;
      p += `DOMINIO: Engenharia de Requisitos\n`;
      p += `Verifique os seguintes aspectos:\n`;
      aspects.forEach((a, i) => (p += `${i + 1}. ${a}\n`));
      p += `\nREGRAS OBRIGATORIAS:\n`;
      p += `- Compare o requisito original com o codigo implementado linha a linha\n`;
      p += `- Identifique gaps entre especificacao e implementacao\n`;
      p += `- Verifique se historias de usuario seguem o criterio INVEST (Independent, Negotiable, Valuable, Estimable, Small, Testable)\n`;
      p += `- Liste requisitos nao funcionais (performance, seguranca, usabilidade, disponibilidade) e se foram atendidos\n`;
      p += `- Verifique se os criterios de aceite estao cobertos por testes\n`;
      p += `- Identifique requisitos implicitos que nao foram especificados mas sao necessarios\n`;
      p += `- Avalie a rastreabilidade: cada requisito deve ter codigo + teste correspondente\n\n`;
      p += `FORMATO DE RESPOSTA:\n`;
      p += `1. Matriz de rastreabilidade (requisito → codigo → teste)\n`;
      p += `2. Gaps identificados com severidade\n`;
      p += `3. Historias de usuario avaliadas pelo criterio INVEST\n`;
      p += `4. Recomendacoes de melhoria na especificacao\n`;
      p += `5. Diffs de correcao para gaps criticos`;
      return p;
    },
  },

  'agile-review': {
    name: 'Metodos Ageis Review',
    fields: [
      { id: 'agl-repo', type: 'text' },
      { id: 'agl-arquivo', type: 'text' },
      { id: 'agl-framework', type: 'select' },
      { id: 'agl-contexto', type: 'textarea' },
      { id: 'agl-bdd', type: 'checkbox' },
      { id: 'agl-art', type: 'checkbox' },
      { id: 'agl-fluxo', type: 'checkbox' },
      { id: 'agl-wsjf', type: 'checkbox' },
      { id: 'agl-dod', type: 'checkbox' },
    ],
    build(d) {
      const repo = d['agl-repo'];
      const arquivo = d['agl-arquivo'];
      const framework = d['agl-framework'];
      const ctx = d['agl-contexto'];
      const aspects = pickLabels(d, [
        ['agl-bdd', 'BDD (Given-When-Then)'],
        ['agl-art', 'Artefatos Scrum (Burndown, DoD)'],
        ['agl-fluxo', 'Metricas de Fluxo (Lead Time)'],
        ['agl-wsjf', 'Priorizacao por Valor (WSJF)'],
        ['agl-dod', 'Definition of Done'],
      ]);
      let p = `Revise o repositorio ${repo} com foco em ${arquivo}, sob a perspectiva de metodos ageis.\n\n`;
      p += `CONTEXTO DA SPRINT/PROJETO: ${ctx}\n`;
      if (framework) p += `FRAMEWORK AGIL: ${framework}\n`;
      p += `\nDOMINIO: Metodos Ageis\n`;
      p += `Verifique os seguintes aspectos:\n`;
      aspects.forEach((a, i) => (p += `${i + 1}. ${a}\n`));
      p += `\nREGRAS OBRIGATORIAS:\n`;
      p += `- Verifique se testes seguem o padrao BDD (Given-When-Then) quando aplicavel\n`;
      p += `- Avalie se os artefatos Scrum estao presentes e atualizados\n`;
      p += `- Analise metricas de fluxo: Lead Time, Throughput, Cycle Time, WIP\n`;
      p += `- Verifique se a priorizacao segue WSJF (Weighted Shortest Job First)\n`;
      p += `- Confirme se a Definition of Done esta sendo respeitada\n`;
      p += `- Identifique se ha deviation do framework agil escolhido\n`;
      p += `- Avalie a qualidade dos commits e mensagens (conexao com historias de usuario)\n\n`;
      p += `FORMATO DE RESPOSTA:\n`;
      p += `1. Avaliacao da maturidade agil do repositorio\n`;
      p += `2. Problemas identificados com severidade\n`;
      p += `3. Metricas de fluxo calculaveis a partir do git history\n`;
      p += `4. Recomendacoes de melhoria nos processos ageis\n`;
      p += `5. Diffs para correcoes de testes/artefatos`;
      return p;
    },
  },

  'ia-ml-review': {
    name: 'IA / Machine Learning Review',
    fields: [
      { id: 'ia-repo', type: 'text' },
      { id: 'ia-arquivo', type: 'text' },
      { id: 'ia-tipo', type: 'select' },
      { id: 'ia-contexto', type: 'textarea' },
      { id: 'ia-vies', type: 'checkbox' },
      { id: 'ia-qual', type: 'checkbox' },
      { id: 'ia-over', type: 'checkbox' },
      { id: 'ia-sec', type: 'checkbox' },
      { id: 'ia-exp', type: 'checkbox' },
      { id: 'ia-lgpd', type: 'checkbox' },
    ],
    build(d) {
      const repo = d['ia-repo'];
      const arquivo = d['ia-arquivo'];
      const tipo = d['ia-tipo'];
      const ctx = d['ia-contexto'];
      const aspects = pickLabels(d, [
        ['ia-vies', 'Vies e Etica nos Dados'],
        ['ia-qual', 'Qualidade dos Dados'],
        ['ia-over', 'Overfitting / Generalizacao'],
        ['ia-sec', 'Seguranca Adversarial'],
        ['ia-exp', 'Explicabilidade (XAI)'],
        ['ia-lgpd', 'Conformidade LGPD'],
      ]);
      let p = `Revise o codigo do repositorio ${repo}, com foco em ${arquivo}, sob a perspectiva de IA/ML.\n\n`;
      p += `CONTEXTO: ${ctx}\n`;
      if (tipo) p += `TIPO DE MODELO: ${tipo}\n`;
      p += `\nDOMINIO: Inteligencia Artificial / Machine Learning\n`;
      p += `Verifique os seguintes aspectos:\n`;
      aspects.forEach((a, i) => (p += `${i + 1}. ${a}\n`));
      p += `\nREGRAS OBRIGATORIAS:\n`;
      p += `- Vies e Etica: analise representatividade dos dados, vies de selecao, vies de atributo\n`;
      p += `- Qualidade dos Dados: integridade, completude, consistencia, atualizacao, duplicidade\n`;
      p += `- Overfitting: verifique separacao treino/teste, cross-validation, regularizacao, early stopping\n`;
      p += `- Generalizacao: avalie se o modelo generaliza para dados fora da distribuicao de treino\n`;
      p += `- Seguranca Adversarial: testes de robustez contra perturbacoes, data poisoning, model inversion\n`;
      p += `- Explicabilidade: verifique uso de SHAP, LIME, feature importance, decisoes auditaveis\n`;
      p += `- LGPD: consentimento para uso de dados, direito ao esquecimento, portabilidade, anonimizacao\n`;
      p += `- Pipeline de ML: validacao de etapas (coleta → preprocessamento → treino → avaliacao → deploy)\n`;
      p += `- Monitoramento: drift detection, performance degradation, retraining triggers\n\n`;
      p += `FORMATO DE RESPOSTA:\n`;
      p += `1. Diagnostico completo do pipeline de ML com severidade\n`;
      p += `2. Analise de vies e etica com metricas especificas\n`;
      p += `3. Matriz de qualidade dos dados\n`;
      p += `4. Recomendacoes de mitigacao para cada risco identificado\n`;
      p += `5. Diffs de correcao para problemas criticos`;
      return p;
    },
  },

  'dados-pipeline': {
    name: 'Dados Intensivos Review',
    fields: [
      { id: 'dl-repo', type: 'text' },
      { id: 'dl-arquivo', type: 'text' },
      { id: 'dl-tech', type: 'select' },
      { id: 'dl-contexto', type: 'textarea' },
      { id: 'dl-5v', type: 'checkbox' },
      { id: 'dl-etl', type: 'checkbox' },
      { id: 'dl-ms', type: 'checkbox' },
      { id: 'dl-ciclo', type: 'checkbox' },
      { id: 'dl-ml', type: 'checkbox' },
    ],
    build(d) {
      const repo = d['dl-repo'];
      const arquivo = d['dl-arquivo'];
      const tech = d['dl-tech'];
      const ctx = d['dl-contexto'];
      const aspects = pickLabels(d, [
        ['dl-5v', 'Big Data (5 Vs)'],
        ['dl-etl', 'Qualidade ETL'],
        ['dl-ms', 'Microsservicos de Dados'],
        ['dl-ciclo', 'Ciclo Analise Completo'],
        ['dl-ml', 'ML Aplicado'],
      ]);
      let p = `Revise o repositorio ${repo}, com foco em ${arquivo}, sob a perspectiva de dados intensivos.\n\n`;
      p += `CONTEXTO: ${ctx}\n`;
      if (tech) p += `TECNOLOGIA PRINCIPAL: ${tech}\n`;
      p += `\nDOMINIO: Big Data e Analise de Dados\n`;
      p += `Verifique os seguintes aspectos:\n`;
      aspects.forEach((a, i) => (p += `${i + 1}. ${a}\n`));
      p += `\nREGRAS OBRIGATORIAS:\n`;
      p += `- 5 Vs do Big Data: avalie Volume, Velocidade, Variedade, Veracidade e Valor\n`;
      p += `- ETL Quality: valide extração (fontes), transformação (regras) e carga (destino)\n`;
      p += `- Verifique tratamento de dados duplicados, nulos e outliers\n`;
      p += `- Avalie idempotencia e reprocessabilidade dos pipelines\n`;
      p += `- Microsservicos de Dados: verifique boundaries, contratos, versionamento de schemas\n`;
      p += `- Ciclo SMART de Analise: Specular → Medir → Analisar → Refinar → Transformar\n`;
      p += `- Verifique monitoramento de pipelines (alertas, SLAs, retry logic)\n`;
      p += `- Governança: linhagem de dados, catalogo de dados, qualidade automatizada\n`;
      p += `- Para ML aplicado: valide data splits, feature engineering, model drift\n\n`;
      p += `FORMATO DE RESPOSTA:\n`;
      p += `1. Arquitetura de dados atual (diagrama textual)\n`;
      p += `2. Problemas identificados com severidade\n`;
      p += `3. Avaliacao dos 5 Vs com gaps\n`;
      p += `4. Recomendacoes de melhoria no pipeline\n`;
      p += `5. Diffs de correcao para problemas criticos`;
      return p;
    },
  },

  'gestao-projeto': {
    name: 'Gestao de Projetos Review',
    fields: [
      { id: 'gp-repo', type: 'text' },
      { id: 'gp-modelo', type: 'select' },
      { id: 'gp-contexto', type: 'textarea' },
      { id: 'gp-escopo', type: 'checkbox' },
      { id: 'gp-risco', type: 'checkbox' },
      { id: 'gp-stake', type: 'checkbox' },
      { id: 'gp-charter', type: 'checkbox' },
      { id: 'gp-aqui', type: 'checkbox' },
    ],
    build(d) {
      const repo = d['gp-repo'];
      const modelo = d['gp-modelo'];
      const ctx = d['gp-contexto'];
      const aspects = pickLabels(d, [
        ['gp-escopo', 'Escopo e EAP'],
        ['gp-risco', 'Gerenciamento de Riscos'],
        ['gp-stake', 'Stakeholders e Comunicacao'],
        ['gp-charter', 'Project Charter'],
        ['gp-aqui', 'Gestao de Aquisicoes'],
      ]);
      let p = `Analise o projeto no repositorio ${repo} sob a perspectiva de gestao de projetos.\n\n`;
      p += `CONTEXTO DO PROJETO: ${ctx}\n`;
      if (modelo) p += `MODELO DE GESTAO: ${modelo}\n`;
      p += `\nDOMINIO: Gestao de Projetos (PMBOK / Hibrido)\n`;
      p += `Verifique os seguintes aspectos:\n`;
      aspects.forEach((a, i) => (p += `${i + 1}. ${a}\n`));
      p += `\nREGRAS OBRIGATORIAS:\n`;
      p += `- Escopo: verifique se a EAP (Estrutura Analitica do Projeto) esta refletida na estrutura do repositorio\n`;
      p += `- Riscos: identifique riscos tecnicos usando probabilidade x impacto, proponha mitigacoes\n`;
      p += `- Stakeholders: mapeie usando matriz Poder/Interesse, identifique gaps de comunicacao\n`;
      p += `- Project Charter: verifique se objetivos, escopo, entregas e restricoes estao documentados\n`;
      p += `- Cronograma: analise git history para identificar cadencia real de entregas\n`;
      p += `- Qualidade: verifique se ha processos de QA, code review e criterios de aceite\n`;
      p += `- Governanca: identifique pontos de decisao, gates e aprovacoes necessarias\n`;
      p += `- Comunicacao: avalie se a documentacao do repo suporta a comunicacao com stakeholders\n\n`;
      p += `FORMATO DE RESPOSTA:\n`;
      p += `1. Diagnostico de maturidade em gestao de projetos\n`;
      p += `2. Matriz de riscos (probabilidade x impacto)\n`;
      p += `3. Mapa de stakeholders com recomendacoes\n`;
      p += `4. Plano de acao priorizado por urgencia\n`;
      p += `5. Artefatos que devem ser criados/atualizados`;
      return p;
    },
  },

  'metricas-okr': {
    name: 'Metricas / OKR Review',
    fields: [
      { id: 'mo-repo', type: 'text' },
      { id: 'mo-contexto', type: 'textarea' },
      { id: 'mo-okr', type: 'checkbox' },
      { id: 'mo-fluxo', type: 'checkbox' },
      { id: 'mo-eff', type: 'checkbox' },
      { id: 'mo-prev', type: 'checkbox' },
      { id: 'mo-little', type: 'checkbox' },
    ],
    build(d) {
      const repo = d['mo-repo'];
      const ctx = d['mo-contexto'];
      const aspects = pickLabels(d, [
        ['mo-okr', 'OKR (Output vs Outcome)'],
        ['mo-fluxo', 'Fluxo (Lead Time, Throughput, WIP)'],
        ['mo-eff', 'Eficiencia vs Eficacia'],
        ['mo-prev', 'Previsibilidade (Monte Carlo)'],
        ['mo-little', 'Lei de Little'],
      ]);
      let p = `Analise o repositorio ${repo} sob a lente de metricas e OKRs.\n\n`;
      p += `CONTEXTO / OKRs DO TIME: ${ctx}\n\n`;
      p += `DOMINIO: Metricas e OKRs para Times de Tecnologia\n`;
      p += `Verifique as seguintes metricas:\n`;
      aspects.forEach((a, i) => (p += `${i + 1}. ${a}\n`));
      p += `\nREGRAS OBRIGATORIAS:\n`;
      p += `- OKR: diferencie outputs (atividades) de outcomes (resultados de negocio)\n`;
      p += `- Verifique se os Key Results sao mensuraveis e have um numero e prazo definido\n`;
      p += `- Fluxo: calcule Lead Time, Throughput, Cycle Time e WIP a partir do git history\n`;
      p += `- Eficiencia vs Eficacia: identifique se o time esta fazendo as coisas certas vs fazendo as coisas direito\n`;
      p += `- Lei de Little: L = W x (WIP/LT), use para estimar tempo de entrega\n`;
      p += `- Previsibilidade: analise se as estimativas historicas sao confiaveis (simulacao Monte Carlo)\n`;
      p += `- Identifique gargalos e ineficiencias no fluxo de entrega\n`;
      p += `- Avalie se ha metricas de qualidade de codigo associadas aos OKRs\n\n`;
      p += `FORMATO DE RESPOSTA:\n`;
      p += `1. Dashboard de metricas calculadas (a partir do repositorio)\n`;
      p += `2. Avaliacao dos OKRs (estao bem definidos? mensuraveis? alinhados?)\n`;
      p += `3. Analise de fluxo com identificacao de gargalos\n`;
      p += `4. Recomendacoes de melhoria nas metricas e processos\n`;
      p += `5. Sugestao de OKRs refinados baseados na realidade do repositorio`;
      return p;
    },
  },

  'squads-review': {
    name: 'Tech Squads Review',
    fields: [
      { id: 'sq-repo', type: 'text' },
      { id: 'sq-tam', type: 'select' },
      { id: 'sq-contexto', type: 'textarea' },
      { id: 'sq-okr', type: 'checkbox' },
      { id: 'sq-estrut', type: 'checkbox' },
      { id: 'sq-comp', type: 'checkbox' },
      { id: 'sq-tuck', type: 'checkbox' },
      { id: 'sq-lider', type: 'checkbox' },
    ],
    build(d) {
      const repo = d['sq-repo'];
      const tam = d['sq-tam'];
      const ctx = d['sq-contexto'];
      const aspects = pickLabels(d, [
        ['sq-okr', 'OKRs do Time'],
        ['sq-estrut', 'Estrutura Multifuncional'],
        ['sq-comp', 'Competencias e Skills'],
        ['sq-tuck', 'Modelo de Tuckman'],
        ['sq-lider', 'Lideranca Positiva'],
      ]);
      let p = `Revise o repositorio ${repo} sob a perspectiva de dinamica de squads.\n\n`;
      p += `CONTEXTO / PERFIL DO TIME: ${ctx}\n`;
      if (tam) p += `TAMANHO DO SQUAD: ${tam}\n`;
      p += `\nDOMINIO: Tech Squads e Dinamica de Times\n`;
      p += `Verifique os seguintes aspectos:\n`;
      aspects.forEach((a, i) => (p += `${i + 1}. ${a}\n`));
      p += `\nREGRAS OBRIGATORIAS:\n`;
      p += `- Estrutura Multifuncional: verifique se o repo demonstra skills compativeis com um squad completo (frontend, backend, QA, design)\n`;
      p += `- OKRs do Time: analise se as entregas no git estao alinhadas com OKRs tipicos de squads de produto\n`;
      p += `- Competencias: mapeie as tecnologias e skills necessarias vs utilizadas no repositorio\n`;
      p += `- Modelo de Tuckman: identifique a fase do time (Forming, Storming, Norming, Performing) baseado nos padroes de commit, PR reviews e documentacao\n`;
      p += `- Lideranca Positiva: avalie se ha mentorias, documentacao compartilhada, code reviews construtivos e conhecimento distribuido\n`;
      p += `- Identifique silos de conhecimento (concentracao de commits em poucas pessoas)\n`;
      p += `- Verifique se ha onboarding documentation e conhecimento compartilhado\n`;
      p += `- Analise a diversidade de contribuicoes (quem faz o que no repo)\n\n`;
      p += `FORMATO DE RESPOSTA:\n`;
      p += `1. Perfil do squad baseado na analise do repositorio\n`;
      p += `2. Mapa de competencias (existentes vs necessarias)\n`;
      p += `3. Diagnostico da fase do time (Tuckman)\n`;
      p += `4. Riscos organizacionais identificados\n`;
      p += `5. Recomendacoes para amadurecimento do squad`;
      return p;
    },
  },
};

// Normaliza o objeto de dados de acordo com o tipo de cada campo do template:
// text/textarea -> string com trim; select -> string sem trim; checkbox -> boolean.
// Campos declarados como string simples são tratados como text.
function normalizeData(fields, data) {
  const out = {};
  for (const f of fields) {
    const id = typeof f === 'string' ? f : f.id;
    const type = typeof f === 'string' ? 'text' : f.type || 'text';
    const raw = data[id];
    if (type === 'checkbox') out[id] = Boolean(raw);
    else if (type === 'select') out[id] = raw != null ? String(raw) : '';
    else out[id] = raw != null ? String(raw).trim() : '';
  }
  return out;
}

// Constrói o prompt para um template dado um objeto de dados (valores brutos do
// formulário). Lança se o template não existir.
export function buildPrompt(templateKey, data = {}) {
  const tpl = generatorTemplates[templateKey];
  if (!tpl) throw new Error(`Template desconhecido: ${templateKey}`);
  return tpl.build(normalizeData(tpl.fields, data));
}

// Lê os valores brutos dos campos do template a partir do DOM (por id),
// retornando um objeto pronto para buildPrompt(). Usado pelo generator.html
// para coletar o formulário e mantido aqui para ser unitariamente testável.
export function collectFormData(templateKey, root = document) {
  const tpl = generatorTemplates[templateKey];
  const data = {};
  if (!tpl) return data;
  for (const f of tpl.fields) {
    const id = typeof f === 'string' ? f : f.id;
    const el = root.getElementById ? root.getElementById(id) : root.querySelector('#' + id);
    if (!el) continue;
    data[id] = el.type === 'checkbox' ? el.checked : el.value;
  }
  return data;
}
