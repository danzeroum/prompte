// generators-original.js — cópia VERBATIM dos 25 builders inline originais de
// generator.html, adaptada apenas para ler de um objeto `data` em vez do DOM.
// Serve como baseline de caracterização: o teste de equivalência compara a saída
// destes builders com a de generators.js para garantir que a migração (M2) não
// alterou os prompts gerados. Não usar em produção.

function makeHelpers(data) {
  const chk = (id) => Boolean(data[id]);
  const val = (id) => (data[id] != null ? String(data[id]).trim() : '');
  const sel = (id) => (data[id] != null ? String(data[id]) : '');
  const bulletList = (text) => {
    if (!text) return '';
    return text
      .split('\n')
      .filter((l) => l.trim())
      .map((l) => '- ' + l.trim())
      .join('\n');
  };
  const checkedItems = (ids) => ids.filter((id) => chk(id));
  return { chk, val, sel, bulletList, checkedItems };
}

export const originalGenerators = {
  'revisao-correcao'(data) {
    const { val, bulletList } = makeHelpers(data);
    const lang = val('rc-linguagem');
    const ctx = val('rc-contexto');
    const code = val('rc-codigo');
    const probs = val('rc-problemas');
    let p = `Revise e corrija o seguinte codigo ${lang}:\n\n`;
    p += '```\n' + code + '\n```\n\n';
    p += `Contexto: ${ctx}\n`;
    if (probs) p += `\nProblemas que percebo:\n${bulletList(probs)}\n`;
    p += `\nPara cada correcao:\n1. Descreva o problema\n2. Justifique a solucao\n3. Forneça o trecho corrigido\n4. Codigo completo corrigido ao final`;
    return p;
  },

  'melhoria-refatoracao'(data) {
    const { val, checkedItems } = makeHelpers(data);
    const lang = val('mr-linguagem');
    const func = val('mr-funcionalidade');
    const code = val('mr-codigo');
    const preoc = val('mr-preocupacao');
    const pr = checkedItems(['mr-perf', 'mr-legi', 'mr-boas', 'mr-seg']).map((id) => {
      const map = {
        'mr-perf': 'Performance',
        'mr-legi': 'Legibilidade',
        'mr-boas': 'Boas praticas',
        'mr-seg': 'Seguranca',
      };
      return map[id];
    });
    let p = `Melhore este codigo ${lang}, priorizando:\n${pr.map((x) => '- ' + x).join('\n')}\n\n`;
    p += '```\n' + code + '\n```\n\n';
    p += `Este codigo faz: ${func}\n`;
    if (preoc) p += `Preocupo-me especialmente com: ${preoc}\n`;
    p += `\nEntregue:\n1. Analise dos problemas encontrados\n2. Para cada melhoria: justificativa + trecho antes/depois\n3. Codigo completo melhorado ao final`;
    return p;
  },

  'tela-para-github'(data) {
    const { val, sel } = makeHelpers(data);
    const lang = val('tg-linguagem');
    const indent = sel('tg-indent');
    const size = sel('tg-indent-size');
    const code = val('tg-codigo');
    const conv = val('tg-convencao');
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

  'debug-erros'(data) {
    const { val } = makeHelpers(data);
    const code = val('db-codigo');
    const erro = val('db-erro');
    const esp = val('db-esperado');
    const atu = val('db-atual');
    let p = `Este codigo esta gerando o seguinte erro:\n\n`;
    p += '```\n' + code + '\n```\n\n';
    p += `Erro/mensagem:\n\`\`\`\n${erro}\n\`\`\`\n\n`;
    p += `O que eu esperava: ${esp}\n`;
    p += `O que acontece: ${atu}\n\n`;
    p += `Faca:\n1. Identifique a causa raiz\n2. Explique o erro em linguagem clara\n3. Forneça o codigo corrigido completo\n4. Sugira como prevenir o problema no futuro`;
    return p;
  },

  'criar-do-zero'(data) {
    const { val, bulletList } = makeHelpers(data);
    const tipo = val('cz-tipo');
    const lang = val('cz-linguagem');
    const func = val('cz-funcionalidades');
    const rest = val('cz-restricoes');
    const est = val('cz-estilo');
    let p = `Crie ${tipo} em ${lang} com os seguintes requisitos:\n\n`;
    p += `Funcionalidades:\n${bulletList(func)}\n`;
    if (rest) p += `\nRestricoes:\n${bulletList(rest)}\n`;
    if (est) p += `\nEstilo: ${est}\n`;
    p += `\nEntregue:\n1. Explicacao da solucao escolhida\n2. Codigo completo pronto para uso\n3. Instrucoes de integracao com o projeto\n4. Testes basicos se aplicavel`;
    return p;
  },

  'explicar-codigo'(data) {
    const { val, sel } = makeHelpers(data);
    const lang = val('ec-linguagem');
    const nivel = sel('ec-nivel');
    const foco = sel('ec-foco');
    const code = val('ec-codigo');
    let p = `Explique detalhadamente este codigo ${lang}:\n\n`;
    p += '```\n' + code + '\n```\n\n';
    p += `Nivel de detalhe: ${nivel}\nFoco em: ${foco}\n\n`;
    p += `Faca:\n1. Visao geral do que o codigo faz\n2. Explicacao linha a linha (ou bloco a bloco)\n3. Conceitos usados (padroes, algoritmos, tecnicas)\n4. Pontos de atencao e possiveis armadilhas`;
    return p;
  },

  'analise-geral'(data) {
    const { val, sel, checkedItems } = makeHelpers(data);
    const repo = val('ag-caminho');
    const prof = sel('ag-profundidade');
    const ctx = val('ag-contexto');
    const aspects = checkedItems([
      'ag-est',
      'ag-qual',
      'ag-seg',
      'ag-doc',
      'ag-dep',
      'ag-perf',
      'ag-test',
    ]).map((id) => {
      const map = {
        'ag-est': 'Estrutura e organizacao',
        'ag-qual': 'Qualidade do codigo',
        'ag-seg': 'Seguranca',
        'ag-doc': 'Documentacao',
        'ag-dep': 'Dependencias e vulnerabilidades',
        'ag-perf': 'Performance e arquitetura',
        'ag-test': 'Testes e coverage',
      };
      return map[id];
    });
    let p = `Analise o repositorio ${repo}.\n\nFoque em:\n`;
    aspects.forEach((a, i) => (p += `${i + 1}. ${a}\n`));
    p += `\nNivel de profundidade: ${prof}\n`;
    if (ctx) p += `\nContexto: ${ctx}\n`;
    p += `\nEntregue:\n1. Resumo executivo\n2. Analise detalhada por aspecto\n3. Problemas encontrados (classificados por severidade)\n4. Recomendacoes prioritarias`;
    return p;
  },

  'analise-especifica'(data) {
    const { val, sel, checkedItems } = makeHelpers(data);
    const repo = val('ae-caminho');
    const area = val('ae-area');
    const cena = sel('ae-cenario');
    const ctx = val('ae-contexto');
    const entre = checkedItems(['ae-lista', 'ae-sugestoes', 'ae-codigo', 'ae-mapadep']).map(
      (id) => {
        const map = {
          'ae-lista': 'Lista de problemas com severidade',
          'ae-sugestoes': 'Sugestoes de correcao',
          'ae-codigo': 'Codigo corrigido pronto',
          'ae-mapadep': 'Mapa de dependencias',
        };
        return map[id];
      },
    );
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

  'analise-comparativa'(data) {
    const { val, checkedItems } = makeHelpers(data);
    const repo = val('ac-caminho');
    const bA = val('ac-branchA');
    const bB = val('ac-branchB');
    const aspects = checkedItems([
      'ac-arq',
      'ac-reg',
      'ac-perf',
      'ac-dep',
      'ac-schema',
      'ac-test',
      'ac-api',
    ]).map((id) => {
      const map = {
        'ac-arq': 'Mudancas de arquitetura',
        'ac-reg': 'Regressoes potenciais',
        'ac-perf': 'Melhorias/pioresias de performance',
        'ac-dep': 'Novas dependencias',
        'ac-schema': 'Mudancas no schema do BD',
        'ac-test': 'Impacto nos testes',
        'ac-api': 'Impacto nas rotas/API',
      };
      return map[id];
    });
    let p = `Compare o estado do repositorio ${repo} entre:\n`;
    p += `- Branch/Pasta A: ${bA}\n- Branch/Pasta B: ${bB}\n\n`;
    p += `Foque em:\n`;
    aspects.forEach((a, i) => (p += `${i + 1}. ${a}\n`));
    p += `\nEntregue:\n1. Resumo das mudancas\n2. Analise de impacto para cada aspecto\n3. Riscos identificados\n4. Recomendacoes antes do merge`;
    return p;
  },

  'refatoracao-orientada'(data) {
    const { val, bulletList, checkedItems } = makeHelpers(data);
    const repo = val('ro-caminho');
    const area = val('ro-area');
    const rest = val('ro-restricoes');
    const pris = checkedItems(['ro-manut', 'ro-perf', 'ro-legi', 'ro-seg', 'ro-todos']).map(
      (id) => {
        const map = {
          'ro-manut': 'Manutenibilidade',
          'ro-perf': 'Performance',
          'ro-legi': 'Legibilidade',
          'ro-seg': 'Seguranca',
          'ro-todos': 'Todas as anteriores',
        };
        return map[id];
      },
    );
    let p = `Analise o repositorio ${repo}`;
    if (area) p += `, especificamente ${area}`;
    p += ` e proponha refatoracoes.\n\n`;
    p += `Priorize: ${pris.join(', ')}\n`;
    if (rest) p += `\nRestricoes:\n${bulletList(rest)}\n`;
    p += `\nPara cada problema encontrado, forneça:\n1. Descricao do problema\n2. Severidade (critica | alta | media | baixa)\n3. Codigo corrigido pronto para uso\n\nEntregue diffs completos prontos para aplicar.`;
    return p;
  },

  'diff-arquivo'(data) {
    const { val, checkedItems } = makeHelpers(data);
    const repo = val('da-repo');
    const file = val('da-arquivo');
    const obs = val('da-obs');
    const foco = checkedItems(['da-perf', 'da-legi', 'da-seg', 'da-padr', 'da-anti']).map((id) => {
      const map = {
        'da-perf': 'Performance',
        'da-legi': 'Legibilidade',
        'da-seg': 'Seguranca',
        'da-padr': 'Padronizacao',
        'da-anti': 'Anti-padroes',
      };
      return map[id];
    });
    let p = `Analise detalhadamente o arquivo ${file} no repositorio ${repo}.\n\n`;
    p += `TAREFA:\n1. Leia todo o arquivo e entenda seu proposito no contexto da arquitetura\n`;
    p += `2. Identifique problemas de:\n   ${foco.map((f) => '- ' + f).join('\n   ')}\n`;
    p += `3. Gere o diff completo do arquivo corrigido\n\n`;
    if (obs) p += `OBSERVACOES: ${obs}\n\n`;
    p += `REGRAS:\n- Mantenha a mesma interface publica (exports, tipos, contratos)\n- Siga EXATAMENTE os padroes que ja existem no restante do projeto\n- Nao adicione dependencias que nao existem no projeto\n- Cada mudanca deve ter justificativa clara\n- O codigo gerado deve ser indistinguivel do estilo do restante da codebase\n\n`;
    p += `FORMATO DE RESPOSTA:\n1. Resumo das mudancas (bullet points)\n2. Para cada mudanca: justificativa + trecho antes → depois\n3. Diff completo do arquivo (pronto para git apply)\n4. Arquivos adicionais que precisam ser modificados (se houver)`;
    return p;
  },

  'diff-modulo'(data) {
    const { val, sel } = makeHelpers(data);
    const repo = val('dm-repo');
    const dir = val('dm-dir');
    const ctx = val('dm-contexto');
    const lang = val('dm-ling');
    const preoc = sel('dm-preoc');
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

  'diff-react'(data) {
    const { val, sel, checkedItems } = makeHelpers(data);
    const repo = val('dr-repo');
    const comp = val('dr-comp');
    const fw = sel('dr-framework');
    const st = sel('dr-estilo');
    const est = sel('dr-estado');
    const foco = checkedItems([
      'dr-logica',
      'dr-hooks',
      'dr-tipo',
      'dr-rend',
      'dr-a11y',
      'dr-error',
    ]).map((id) => {
      const map = {
        'dr-logica': 'Separar logica de apresentacao',
        'dr-hooks': 'Extrair hooks customizados',
        'dr-tipo': 'Melhorar tipagem TypeScript',
        'dr-rend': 'Otimizar re-renders',
        'dr-a11y': 'Acessibilidade (a11y)',
        'dr-error': 'Error boundaries',
      };
      return map[id];
    });
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

  'diff-api'(data) {
    const { val, sel, checkedItems } = makeHelpers(data);
    const repo = val('di-repo');
    const file = val('di-arquivo');
    const fw = sel('di-framework');
    const db = sel('di-db');
    const auth = sel('di-auth');
    const obs = val('di-obs');
    const foco = checkedItems(['di-val', 'di-err', 'di-sec', 'di-perf', 'di-log', 'di-contr']).map(
      (id) => {
        const map = {
          'di-val': 'Validacao de input',
          'di-err': 'Tratamento de erros',
          'di-sec': 'Seguranca',
          'di-perf': 'Performance (N+1, paginacao)',
          'di-log': 'Logging e monitoramento',
          'di-contr': 'Contratos de resposta',
        };
        return map[id];
      },
    );
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

  'diff-testes'(data) {
    const { val, sel, bulletList } = makeHelpers(data);
    const repo = val('dt-repo');
    const file = val('dt-arquivo');
    const fw = sel('dt-framework');
    const prob = val('dt-problemas');
    let p = `Analise os testes em ${file} no repositorio ${repo}.\n\n`;
    p += `TAREFA:\n1. Leia os testes E o codigo que eles testam\n`;
    p += `2. Identifique:\n   - Testes que nao testam nada util (testes fracos)\n   - Caminhos felizes e tristes nao cobertos\n   - Mocks incorretos ou excessivos\n   - Testes faceis (quebram por mudancas irrelevantes)\n   - Inconsistencia com o padrao de testes do projeto\n`;
    p += `3. Compare com outros testes do projeto para seguir o MESMO estilo\n\n`;
    if (fw !== 'deixe descobrir') p += `Framework de testes: ${fw}\n\n`;
    if (prob) p += `Problemas que percebo:\n${bulletList(prob)}\n\n`;
    p += `FORMATO DE RESPOSTA:\n1. Coverage: o que esta coberto e o que falta\n2. Problemas nos testes atuais\n3. Diff completo dos testes melhorados\n4. Novos testes adicionados (com justificativa do que cobrem)`;
    return p;
  },

  'diff-performance'(data) {
    const { val, sel } = makeHelpers(data);
    const repo = val('dp-repo');
    const file = val('dp-arquivo');
    const freq = sel('dp-freq');
    const vol = val('dp-volume');
    const garg = val('dp-gargalo');
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

  'diff-canivete'(data) {
    const { val, sel } = makeHelpers(data);
    const repo = val('dc-repo');
    const esc = val('dc-escopo');
    const tipo = sel('dc-tipo');
    const ctx = val('dc-contexto');
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

  'cloud-review'(data) {
    const { val, sel, checkedItems } = makeHelpers(data);
    const repo = val('cl-repo');
    const arquivo = val('cl-arquivo');
    const provider = sel('cl-provider');
    const ctx = val('cl-contexto');
    const aspects = checkedItems([
      'cl-sec',
      'cl-model',
      'cl-mig',
      'cl-comp',
      'cl-iac',
      'cl-cont',
    ]).map((id) => {
      const map = {
        'cl-sec': 'Seguranca (IAM, criptografia, flags)',
        'cl-model': 'Modelo de servico (SaaS/PaaS/IaaS)',
        'cl-mig': 'Preparacao para migracao',
        'cl-comp': 'Compliance (LGPD, NIST, BACEN)',
        'cl-iac': 'Infra as Code (Terraform/CloudFormation)',
        'cl-cont': 'Containers (Docker/K8s)',
      };
      return map[id];
    });
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

  'requisitos-review'(data) {
    const { val, checkedItems } = makeHelpers(data);
    const repo = val('rq-repo');
    const arquivo = val('rq-arquivo');
    const ctx = val('rq-contexto');
    const aspects = checkedItems(['rq-inv', 'rq-nf', 'rq-back', 'rq-proto', 'rq-sla']).map((id) => {
      const map = {
        'rq-inv': 'Historias de Usuario (INVEST)',
        'rq-nf': 'Requisitos Nao Funcionais',
        'rq-back': 'Alinhamento com Backlog',
        'rq-proto': 'Prototipos e Especificacoes',
        'rq-sla': 'SLAs e Metricas de Aceite',
      };
      return map[id];
    });
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

  'agile-review'(data) {
    const { val, sel, checkedItems } = makeHelpers(data);
    const repo = val('agl-repo');
    const arquivo = val('agl-arquivo');
    const framework = sel('agl-framework');
    const ctx = val('agl-contexto');
    const aspects = checkedItems(['agl-bdd', 'agl-art', 'agl-fluxo', 'agl-wsjf', 'agl-dod']).map(
      (id) => {
        const map = {
          'agl-bdd': 'BDD (Given-When-Then)',
          'agl-art': 'Artefatos Scrum (Burndown, DoD)',
          'agl-fluxo': 'Metricas de Fluxo (Lead Time)',
          'agl-wsjf': 'Priorizacao por Valor (WSJF)',
          'agl-dod': 'Definition of Done',
        };
        return map[id];
      },
    );
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

  'ia-ml-review'(data) {
    const { val, sel, checkedItems } = makeHelpers(data);
    const repo = val('ia-repo');
    const arquivo = val('ia-arquivo');
    const tipo = sel('ia-tipo');
    const ctx = val('ia-contexto');
    const aspects = checkedItems([
      'ia-vies',
      'ia-qual',
      'ia-over',
      'ia-sec',
      'ia-exp',
      'ia-lgpd',
    ]).map((id) => {
      const map = {
        'ia-vies': 'Vies e Etica nos Dados',
        'ia-qual': 'Qualidade dos Dados',
        'ia-over': 'Overfitting / Generalizacao',
        'ia-sec': 'Seguranca Adversarial',
        'ia-exp': 'Explicabilidade (XAI)',
        'ia-lgpd': 'Conformidade LGPD',
      };
      return map[id];
    });
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

  'dados-pipeline'(data) {
    const { val, sel, checkedItems } = makeHelpers(data);
    const repo = val('dl-repo');
    const arquivo = val('dl-arquivo');
    const tech = sel('dl-tech');
    const ctx = val('dl-contexto');
    const aspects = checkedItems(['dl-5v', 'dl-etl', 'dl-ms', 'dl-ciclo', 'dl-ml']).map((id) => {
      const map = {
        'dl-5v': 'Big Data (5 Vs)',
        'dl-etl': 'Qualidade ETL',
        'dl-ms': 'Microsservicos de Dados',
        'dl-ciclo': 'Ciclo Analise Completo',
        'dl-ml': 'ML Aplicado',
      };
      return map[id];
    });
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

  'gestao-projeto'(data) {
    const { val, sel, checkedItems } = makeHelpers(data);
    const repo = val('gp-repo');
    const modelo = sel('gp-modelo');
    const ctx = val('gp-contexto');
    const aspects = checkedItems([
      'gp-escopo',
      'gp-risco',
      'gp-stake',
      'gp-charter',
      'gp-aqui',
    ]).map((id) => {
      const map = {
        'gp-escopo': 'Escopo e EAP',
        'gp-risco': 'Gerenciamento de Riscos',
        'gp-stake': 'Stakeholders e Comunicacao',
        'gp-charter': 'Project Charter',
        'gp-aqui': 'Gestao de Aquisicoes',
      };
      return map[id];
    });
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

  'metricas-okr'(data) {
    const { val, checkedItems } = makeHelpers(data);
    const repo = val('mo-repo');
    const ctx = val('mo-contexto');
    const aspects = checkedItems(['mo-okr', 'mo-fluxo', 'mo-eff', 'mo-prev', 'mo-little']).map(
      (id) => {
        const map = {
          'mo-okr': 'OKR (Output vs Outcome)',
          'mo-fluxo': 'Fluxo (Lead Time, Throughput, WIP)',
          'mo-eff': 'Eficiencia vs Eficacia',
          'mo-prev': 'Previsibilidade (Monte Carlo)',
          'mo-little': 'Lei de Little',
        };
        return map[id];
      },
    );
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

  'squads-review'(data) {
    const { val, sel, checkedItems } = makeHelpers(data);
    const repo = val('sq-repo');
    const tam = sel('sq-tam');
    const ctx = val('sq-contexto');
    const aspects = checkedItems(['sq-okr', 'sq-estrut', 'sq-comp', 'sq-tuck', 'sq-lider']).map(
      (id) => {
        const map = {
          'sq-okr': 'OKRs do Time',
          'sq-estrut': 'Estrutura Multifuncional',
          'sq-comp': 'Competencias e Skills',
          'sq-tuck': 'Modelo de Tuckman',
          'sq-lider': 'Lideranca Positiva',
        };
        return map[id];
      },
    );
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
  'gen-review'(data) {
    const { val: v, checkedItems } = makeHelpers(data);

    const repo = v('grv-repo'),
      arq = v('grv-arq'),
      ctx = v('grv-ctx');
    const domains = checkedItems([
      'grv-verif',
      'grv-test',
      'grv-sast',
      'grv-rev',
      'grv-qual',
      'grv-solid',
      'grv-clean',
      'grv-arqcb',
      'grv-devops',
      'grv-perf',
    ]);
    const domainLabels = {
      'grv-verif': 'Verificacao e Validacao (shift-left testing)',
      'grv-test': 'Testes em todos os niveis (unidade, integracao, sistema, aceitacao)',
      'grv-sast': 'Analise estatica automatizada (SAST) para code smells e vulnerabilidades',
      'grv-rev': 'Revisao de codigo por pares (detectar oportunidades de melhoria mutua)',
      'grv-qual':
        'Atributos de qualidade: escalabilidade, performance, seguranca, disponibilidade, manutenibilidade',
      'grv-solid':
        'Principios SOLID (Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion)',
      'grv-clean': 'Clean Code (nomes descritivos, funcoes curtas, sem duplicacao) + 12-Factor App',
      'grv-arqcb': 'Arquitetura (C4, 4+1), refatoracao e evolucao modular',
      'grv-devops': 'DevOps / CI-CD pipeline, automacao de build e deploy',
      'grv-perf':
        'Performance e escalabilidade horizontal/vertical, metricas e balanceamento de carga',
    };
    let p = `Analise detalhadamente o repositorio ${repo}, com foco em ${arq}.\n\n`;
    p += `CONTEXTO: ${ctx}\n\n`;
    p += `INSTRUCAO DE DOMINIO:\nVerifique os seguintes aspectos de qualidade do codigo aplicando frameworks e principios reconhecidos de engenharia de software:\n\n`;
    domains.forEach((_, i) => {
      const label = domainLabels[_];
      p += `${i + 1}. ${label}\n`;
    });
    p += `\nREGRAS OBRIGATORIAS:\n- Mantenha a interface publica (exports, tipos, contratos) sem breaking changes\n`;
    p += `- Siga EXATAMENTE os padroes existentes no restante do projeto\n`;
    p += `- O codigo gerado deve ser indistinguivel do estilo da codebase\n`;
    p += `\nFORMATO DE RESPOSTA:\n1. Resumo executivo das mudancas\n`;
    p += `2. Para cada mudanca: justificativa + trecho antes/depois\n`;
    p += `3. Diff completo de CADA arquivo (pronto para git apply)\n`;
    p += `4. Novos arquivos criados (com conteudo completo)\n`;
    p += `5. Testes atualizados/criados\n`;
    p += `6. Riscos da mudanca e como mitigar\n`;
    return p;
  },
  'gen-api'(data) {
    const { val: v, sel, checkedItems } = makeHelpers(data);

    const repo = v('ap-repo'),
      arq = v('ap-arq'),
      ctx = v('ap-ctx'),
      fw = sel('ap-fw');
    const domains = checkedItems(['ap-design', 'ap-anti', 'ap-obs', 'ap-sec', 'ap-doc', 'ap-perf']);
    const domainLabels = {
      'ap-design':
        'Design RESTful (substantivos autoexplicativos, metodos HTTP, feedback, exemplos de resposta)',
      'ap-anti':
        'Anti-Patterns de API (versionamento, documentacao ausente, sem rate limiting, sem logs, sem docs)',
      'ap-obs':
        'Observabilidade (logs estruturados com contexto, metricas de desempenho, tracing de requisicoes)',
      'ap-sec':
        'Seguranca (autenticacao, validacao de input, rate limiting, protecao contra ataques comuns)',
      'ap-doc': 'Documentacao (OpenAPI/Swagger, exemplos de resposta claros, guias de uso)',
      'ap-perf':
        'Performance e escalabilidade (identificar gargalos, testes de carga, balanceamento de carga)',
    };
    let p = `Analise detalhadamente o repositorio ${repo}, com foco em ${arq}.\n\n`;
    p += `CONTEXTO: ${ctx}\n`;
    if (fw) p += `FRAMEWORK: ${fw}\n`;
    p += `\nINSTRUCAO DE DOMINIO — Verifique os seguintes aspectos do design da API:\n\n`;
    domains.forEach((_, i) => {
      p += `${i + 1}. ${domainLabels[_]}\n`;
    });
    p += `\nREGRAS OBRIGATORIAS:\n- A API deve ser facil de ler e dificil de usar incorretamente\n`;
    p += `- Use substantivos no plural, autoexplicativos e consistentes\n`;
    p += `- Feedback deve ser informativo (erros HTTP padrao + mensagens claras)\n`;
    p += `- Inclua exemplos de resposta para GET (compreensivel em menos de 5s)\n`;
    p += `- Manter completude e concisao ao longo das verses\n`;
    p += `\nFORMATO DE RESPOSTA:\n1. Diagnostico com severidade (critica | alta | media | baixa)\n`;
    p += `2. Diff completo de cada arquivo corrigido\n3. Novos arquivos criados (se houver)\n`;
    p += `4. Migration SQL se o schema mudar\n5. Testes atualizados/criados`;
    return p;
  },
  'gen-arch'(data) {
    const { val: v, checkedItems } = makeHelpers(data);

    const repo = v('ar-repo'),
      arq = v('ar-arq'),
      ctx = v('ar-ctx');
    const domains = checkedItems([
      'ar-4pil',
      'ar-qual',
      'ar-leis',
      'ar-c4',
      'ar-refat',
      'ar-cloud',
      'ar-devops',
    ]);
    const domainLabels = {
      'ar-4pil': '4 Pilares da Arquitetura (estrutura, "-ilities", decisoes, principios de design)',
      'ar-qual':
        'Atributos de Qualidade (escalabilidade, performance, seguranca, disponibilidade, manutenibilidade, testabilidade)',
      'ar-leis':
        'Leis do Trabalho Arquitetural: (1a) Toda decisao tem seu preco; (2a) Avalie no contexto especifico',
      'ar-c4':
        'Documentacao C4 (Contexto, Container, Componente, Codigo) para comunicacao clara com stakeholders',
      'ar-refat':
        'Refatoracao e Evolucao (dependencias, automacao, testes de validacao, padroes emergentes)',
      'ar-cloud':
        'Arquiteturas Distribuidas e de Nuvem (escalabilidade, resiliencia, flexibilidade, observabilidade)',
      'ar-devops':
        'DevOps / CI/CD (containers, microsservicos, cultura de iteracao continua, automacao de infra)',
    };
    let p = `Analise detalhadamente o repositorio ${repo}, com foco em ${arq}.\n\n`;
    p += `CONTEXO: ${ctx}\n\n`;
    p += `INSTRUCAO DE DOMINIO — Avalie o projeto considerando os seguintes principios arquiteturais:\n\n`;
    domains.forEach((_, i) => {
      p += `${i + 1}. ${domainLabels[_]}\n`;
    });
    p += `\nREGRAS OBRIGATORIAS:\n- Identifique as preocupacoes de dominio para extrair caracteristicas arquiteturais\n`;
    p += `- Cada nova requisicao pode ter impacto significativo na arquitetura\n`;
    p += `- Documente decisoes com trade-offs explicitos\n`;
    p += `- Use modelos de documentacao (C4 e 4+1) para comunicacao\n`;
    p += `\nFORMATO DE RESPOSTA:\n1. Mapa de stakeholders e suas preocupacoes\n`;
    p += `2. Caracteristicas arquiteturais identificadas (com severidade)\n`;
    p += `3. Justificativa para cada decisao de arquitetura\n`;
    p += `4. Documentacao C4 atualizada\n`;
    p += `5. Diff completo de cada arquivo alterado\n`;
    p += `6. Plano de evolucao gradual (sem breaking changes)\n`;
    return p;
  },
  'gen-security'(data) {
    const { val: v, sel } = makeHelpers(data);

    const repo = v('se-repo'),
      arq = v('se-arq'),
      ctx = v('se-ctx');
    const nivel = sel('se-nivel'),
      dado = sel('se-dado');
    const domainLabels = {
      'lgpd-completa': 'LGPD Completa (todos os 10 principios + bases legais)',
      'lgpd-essenciais': 'LGPD Essenciais (5 principios + bases legais)',
      'owasp-top10': 'OWASP Top 10 + LGPD (API Security Top 10)',
      'pbd-7principios': 'Privacy by Design (7 principios de Ann Cavoukian)',
      completo: 'Completo (LGPD + OWASP + Privacy by Design)',
    };
    const dataLabels = {
      geral: 'Dados pessoais gerais',
      sensivel: 'Dados pessoais sensiveis',
      critico: 'Dados criticos (saude, financeiro)',
      crianca: 'Dados de criancas e adolescentes',
    };
    let p = `Analise detalhadamente o repositorio ${repo}, com foco em ${arq}.\n\n`;
    p += `CONTEXO: ${ctx}\n`;
    p += `NIVEL DE CONFORMIDADE: ${domainLabels[nivel]}\n`;
    p += `TIPO DE DADO: ${dataLabels[dado]}\n\n`;
    p += `INSTRUCAO DE DOMINIO — Verifique conformidade com os seguintes principios de privacidade e seguranca:\n\n`;
    if (nivel === 'lgpd-completa' || nivel === 'completo') {
      p += `1. Princípio da Finalidade: tratamento compatível com finalidade especificada\n`;
      p += `2. Princípio da Adequação: dados minimos, necessários, relevantes e transparentes\n`;
      p += `3. Princípio da Necessidade: apenas dados necessarios para a finalidade\n`;
      p += `4. Princípio da Livre Acesso: dados acessíveis ao titular\n`;
      p += `5. Princípio da Transparência: informar o titular de forma clara e acessível\n`;
      p += `6. Princípio da Segurança: proteção contra acesso não autorizado e breach\n`;
      p += `7. Princípio da Prevenção: medidas preventivas contra incidentes\n`;
      p += `8. Princípio da Não Discriminacao: tratamento igualitario\n`;
      p += `9. Princípio da Responsabilização: agentes prestam contas\n`;
      p += `10. Princípio da Integridade: dados consistentes entre sistemas\n`;
    } else if (nivel === 'pbd-7principios') {
      p += `1. Desenvolvimento Proativo e Preventivo\n2. Privacidade por Padrão (Privacy by Default)\n3. Privacidade Incorporada ao Design\n4. Soma Positiva (sem contrapartidas)\n5. Visibilidade e Transparência\n6. Segurança Ponta a Ponta\n7. Desenvolvimento Centrado no Usuário\n`;
    }
    if (nivel === 'owasp-top10' || nivel === 'completo') {
      p += `\nVERIFICACAO OWASP TOP 10 (2021):\n`;
      p += `A01 - Broken Access Control\nA02 - Cryptographic Failures\nA03 - Injection\nA04 - Insecure Design\nA05 - Security Misconfiguration\nA06 - Vulnerable and Outdated Components\nA07 - Identification and Authentication Failures\nA08 - Software and Data Integrity Failures\nA09 - Security Logging and Monitoring Failures\nA10 - Server-Side Request Forgery\n`;
    }
    if (nivel === 'lgpd-essenciais') {
      p += `\nPRINCIPIOS LGPD ESSENCIAIS:\n1. Finalidade\n2. Adequacao\n3. Necessidade\n4. Livre Acesso\n5. Transparencia\n`;
    }
    p += `\nREGRAS OBRIGATORIAS:\n- Documente a base legal (consentimento, obrigatoriedade)\n- Inclua cadeia de evidencias para auditoria\n- Forneça plano de resposta a incidentes\n- Verifique classificações de dados sensíveis\n`;
    p += `\nFORMATO DE RESPOSTA:\n1. Diagnostico de conformidade (itens em conformidade e pendentes)\n`;
    p += `2. Vulnerabilidades de seguranca e privacidade encontradas\n`;
    p += `3. Diff completo de cada arquivo corrigido\n`;
    p += `4. Guia de compliance para auditoria\n`;
    p += `5. Plano de resposta a incidentes\n`;
    return p;
  },
  'gen-ux'(data) {
    const { val: v, sel, checkedItems } = makeHelpers(data);

    const repo = v('ux-repo'),
      arq = v('ux-arq'),
      ctx = v('ux-ctx');
    const ui = sel('ux-ui'),
      st = sel('ux-style');
    const domains = checkedItems([
      'ux-heur',
      'ux-acess',
      'ux-design',
      'ux-proto',
      'ux-ia',
      'ux-journey',
      'ux-mobile',
      'ux-a11y',
    ]);
    const domainLabels = {
      'ux-heur': 'Analise Heuristica de Usabilidade (Nielsen)',
      'ux-acess': 'Acessibilidade (WCAG 2.1 AA, contraste, adaptavel)',
      'ux-design': 'Design Centrado no Usuario (empatia, definir, idear, prototipar, testar)',
      'ux-proto': 'Prototipacao Rapida (Crazy 8s, wireframes de baixa fidelidade para co-criacao)',
      'ux-ia': 'Arquitetura de Informacao (organizacao, navegacao, rotulacao, hierarquia)',
      'ux-journey': 'Jornada do Usuario (antes, durante e depois — mapeamento de pontos de dor)',
      'ux-mobile': 'Mobile-first (responsividade, gestos touch, prioridade de conteudo)',
      'ux-a11y': 'Internacionalizacao i18n (suporte a multiplos idiomas e localizacao)',
    };
    let p = `Analise detalhadamente o repositorio ${repo}, com foco em ${arq}.\n\n`;
    p += `CONTEXTO: ${ctx}\n`;
    if (ui) p += `FRAMEWORK UI: ${ui}\n`;
    if (st) p += `ESTILO UI: ${st}\n`;
    p += `\nINSTRUCAO DE DOMINIO — Avalie a experiencia do usuario considerando:\n\n`;
    domains.forEach((_, i) => {
      p += `${i + 1}. ${domainLabels[_]}\n`;
    });
    p += `\nREGRAS OBRIGATORIAS:\n- A analise deve ir alem da estetica ("como se sente ao usar")\n`;
    p += `- Nao crie "usuario padrao" — considere necessidades explicitas e implicitas\n`;
    p += `- Priorize a acessibilidade universal desde o design\n`;
    p += `- Use personas como base para hipoteses de teste\n`;
    p += `\nFORMATO DE RESPOSTA:\n1. Resultados de pesquisa de usuario (quem sao, o que fazem)\n`;
    p += `2. Mapa de necessidades (explicitas e implicitas)\n`;
    p += `3. Analise heuristica ( Nielsen) com problemas por severidade\n`;
    p += `4. Sugestoes de melhoria com priorizacao\n`;
    p += `5. Wireframes ou especificacoes de prototipo\n`;
    return p;
  },
  'gen-canivete'(data) {
    const { val: v, sel, checkedItems } = makeHelpers(data);

    const repo = v('cs-repo'),
      arq = v('cs-arq'),
      ctx = v('cs-ctx');
    const tipo = sel('cs-tipo'),
      prof = sel('cs-profund');
    const domains = checkedItems([
      'rq-verif',
      'rq-test',
      'rq-sast',
      'rq-rev',
      'rq-qual',
      'rq-solid',
      'rq-clean',
      'rq-arqcb',
      'rq-devops',
      'rq-perf',
    ]);
    const domainLabels = {
      'rq-verif': 'Verificacao e Validacao (shift-left)',
      'rq-test': 'Testes em todos os niveis',
      'rq-sast': 'Analise Estatica (SAST)',
      'rq-rev': 'Code Review por pares',
      'rq-qual': 'Atributos de Qualidade (-ilities)',
      'rq-solid': 'Principios SOLID',
      'rq-clean': 'Clean Code + 12-Factor App',
      'rq-arqcb': 'Arquitetura (C4, Refatoracao)',
      'rq-devops': 'DevOps / Pipeline',
      'rq-perf': 'Performance e Escalabilidade',
    };
    const profLabels = {
      completa: 'Completa (todas as camadas)',
      focada: 'Focada (dominios relevantes)',
      resumida: 'Resumida (checklist + diffs)',
    };
    const tipoLabels = {
      tudo: 'Analise completa',
      qualidade: 'Qualidade e Testes',
      arquitetura: 'Arquitetura e Design',
      seguranca: 'Seguranca e Compliance',
      performance: 'Performance e Escalabilidade',
      ux: 'UX e Usabilidade',
      devops: 'DevOps e Pipeline',
      processos: 'Processos e Automacao',
      refatoracao: 'Refatoracao Geral',
    };
    let p = `Analise detalhadamente o repositorio ${repo}, com foco em ${arq}.\n\n`;
    p += `CONTEXO: ${ctx}\n`;
    p += `PROFUNDIDADE: ${profLabels[prof]}\n`;
    p += `TIPO DE MELHORIA: ${tipoLabels[tipo]}\n\n`;
    p += `INSTRUCAO DE DOMINIO — Aplique camadas de verificacao de qualidade multi-domínio:\n\n`;
    domains.forEach((_, i) => {
      p += `${i + 1}. ${domainLabels[_]}\n`;
    });
    p += `\nREGRAS OBRIGATORIAS:\n- Todos os diffs devem manter a interface publica sem breaking changes\n`;
    p += `- O codigo gerado deve ser indistinguivel do estilo da codebase\n`;
    p += `- Priorize mudancas com maior impacto/complexidade\n`;
    p += `- Testes validam integridade apos cada alteracao\n`;
    p += `\nFORMATO DE RESPOSTA:\n`;
    p += `1. Resumo executivo das mudancas (bullet points)\n`;
    p += `2. Justificativa detalhada para CADA mudanca\n`;
    p += `3. Diff completo de CADA arquivo (pronto para git apply)\n`;
    p += `4. Novos arquivos criados (conteudo completo)\n`;
    p += `5. Testes atualizados/criados para cada arquivo\n`;
    p += `6. Riscos da mudanca e como mitigar\n`;
    p += `7. Plano de validacao e regressao\n`;
    return p;
  },
  'gen-cloud'(data) {
    const { val: v, checkedItems } = makeHelpers(data);

    const repo = v('gcl-repo'),
      arq = v('gcl-arq'),
      ctx = v('gcl-ctx');
    const domains = checkedItems([
      'gcl-sec',
      'gcl-model',
      'gcl-migr',
      'gcl-comp',
      'gcl-iac',
      'gcl-cont',
    ]);
    const domainLabels = {
      'gcl-sec':
        'Seguranca na Nuvem (IAM, flags de protecao, criptografia, responsabilidade compartilhada)',
      'gcl-model':
        'Modelos de Servico (SaaS, PaaS, IaaS, FaaS) — verificacao de provisionamento otimizado',
      'gcl-migr':
        'Migracao e Adocao Cloud (6 pilares: negocios, pessoas, governanca, plataforma, seguranca, operacoes)',
      'gcl-comp': 'Compliance (LGPD, resolucao BACEN 4.658, NIST CSF, seguranca by design)',
      'gcl-iac': 'Infraestrutura como Codigo (IaC) — Terraform, CloudFormation, automacao',
      'gcl-cont': 'Containers e Orquestracao (Docker, Kubernetes, resiliencia, escalabilidade)',
    };
    let p = `Analise detalhadamente o repositorio ${repo}, com foco em ${arq}.\n\n`;
    p += `CONTEXTO: ${ctx}\n\n`;
    p += `INSTRUCAO DE DOMINIO — Verifique os seguintes aspectos de computacao em nuvem:\n\n`;
    domains.forEach((_, i) => {
      p += `${i + 1}. ${domainLabels[_]}\n`;
    });
    p += `\nREGRAS OBRIGATORIAS:\n- Siga o modelo de responsabilidade compartilhada da nuvem\n`;
    p += `- Verifique configuracoes de seguranca (IAM, policies, criptografia at-rest e in-transit)\n`;
    p += `- Avalie otimizacao de custos (Pay as you Go, right-sizing)\n`;
    p += `- Garanta conformidade regulatória aplicavel ao setor\n`;
    p += `\nFORMATO DE RESPOSTA:\n1. Diagnostico de seguranca cloud (critica | alta | media | baixa)\n`;
    p += `2. Avaliacao de modelo de servico e provisionamento\n`;
    p += `3. Verificacao de compliance e regulacao\n`;
    p += `4. Diff completo de cada arquivo corrigido\n`;
    p += `5. Recomendacoes de otimizacao e hardening\n`;
    return p;
  },
  'gen-ia'(data) {
    const { val: v, sel, checkedItems } = makeHelpers(data);

    const repo = v('gia-repo'),
      arq = v('gia-arq'),
      ctx = v('gia-ctx');
    const tipo = sel('gia-tipo');
    const domains = checkedItems([
      'gia-vies',
      'gia-qual',
      'gia-over',
      'gia-sec',
      'gia-expl',
      'gia-lgpd',
    ]);
    const domainLabels = {
      'gia-vies':
        'Vies e Etica (datasets diversos e representativos, auditoria de vies, prevencao de discriminacao)',
      'gia-qual':
        'Qualidade dos Dados (completude, consistencia, veracidade, principio "garbage in, trash out")',
      'gia-over':
        'Overfitting e Generalizacao (separacao treino/teste, metricas de avaliacao, generalizacao)',
      'gia-sec':
        'Seguranca de IA (ataques adversarios, supervisao humana, principios de IA responsavel)',
      'gia-expl': 'Explicabilidade (transparencia, justica, interpretabilidade do modelo)',
      'gia-lgpd':
        'Conformidade LGPD/GDPR (tratamento de dados sensiveis, base legal, direitos do titular)',
    };
    const tipoLabels = {
      Classificacao: 'Classificacao',
      Regressao: 'Regressao',
      NLP: 'NLP / Processamento de Linguagem',
      Visao: 'Visao Computacional',
    };
    let p = `Analise detalhadamente o repositorio ${repo}, com foco em ${arq}.\n\n`;
    p += `CONTEXTO: ${ctx}\n`;
    if (tipo) p += `TIPO DE MODELO: ${tipoLabels[tipo]}\n`;
    p += `\nINSTRUCAO DE DOMINIO — Verifique os seguintes aspectos de engenharia de IA:\n\n`;
    domains.forEach((_, i) => {
      p += `${i + 1}. ${domainLabels[_]}\n`;
    });
    p += `\nREGRAS OBRIGATORIAS:\n- Verifique vies nos dados de treinamento e nos resultados do modelo\n`;
    p += `- Aplique o principio "garbage in, trash out" na avaliacao de qualidade dos dados\n`;
    p += `- Garanta separacao adequada treino/teste com metricas condizentes\n`;
    p += `- Avalie robustez contra ataques adversarios\n`;
    p += `- Verifique conformidade com LGPD/GDPR no tratamento de dados\n`;
    p += `\nFORMATO DE RESPOSTA:\n1. Diagnostico de vies e etica no modelo\n`;
    p += `2. Avaliacao de qualidade dos dados e pipeline\n`;
    p += `3. Analise de overfitting/underfitting com metricas\n`;
    p += `4. Diff completo de cada arquivo corrigido\n`;
    p += `5. Plano de mitigacao de riscos de IA\n`;
    return p;
  },
  'gen-dados'(data) {
    const { val: v, checkedItems } = makeHelpers(data);

    const repo = v('gda-repo'),
      arq = v('gda-arq'),
      ctx = v('gda-ctx');
    const domains = checkedItems(['gda-5vs', 'gda-etl', 'gda-ms', 'gda-anal', 'gda-qd', 'gda-ml']);
    const domainLabels = {
      'gda-5vs': 'Big Data 5 Vs (volume, velocidade, variedade, veracidade, valor)',
      'gda-etl':
        'ETL e Qualidade de Dados (tratamento de faltantes, anomalias, normalizacao, rastreabilidade)',
      'gda-ms':
        'Microsservicos (dominio bem definido, baixo acoplamento, deploy independente, resiliencia)',
      'gda-anal':
        'Analise e Decisao (ciclo completo: definicao, coleta, preparacao, modelagem, comunicacao, feedback)',
      'gda-qd':
        'Qualidade dos Dados (completude, consistencia, veracidade, integracao de multiplas fontes)',
      'gda-ml': 'ML Aplicado (modelos preditivos, metricas SMART, validacao com dados reais)',
    };
    let p = `Analise detalhadamente o repositorio ${repo}, com foco em ${arq}.\n\n`;
    p += `CONTEXTO: ${ctx}\n\n`;
    p += `INSTRUCAO DE DOMINIO — Verifique os seguintes aspectos de sistemas intensivos em dados:\n\n`;
    domains.forEach((_, i) => {
      p += `${i + 1}. ${domainLabels[_]}\n`;
    });
    p += `\nREGRAS OBRIGATORIAS:\n- Avalie se a arquitetura suporta os 5 Vs do Big Data\n`;
    p += `- Verifique integridade do pipeline ETL completo\n`;
    p += `- Garanta consistencia e rastreabilidade na integracao de multiplas fontes\n`;
    p += `- Defina metricas segundo o modelo SMART\n`;
    p += `\nFORMATO DE RESPOSTA:\n1. Avaliacao dos 5 Vs do Big Data na arquitetura\n`;
    p += `2. Diagnostico do pipeline ETL (qualidade, consistencia, rastreabilidade)\n`;
    p += `3. Diff completo de cada arquivo corrigido\n`;
    p += `4. Recomendacoes de arquitetura e performance\n`;
    p += `5. Plano de metricas e monitoramento\n`;
    return p;
  },
  'gen-gestao'(data) {
    const { val: v, checkedItems } = makeHelpers(data);

    const repo = v('ge-repo'),
      ctx = v('ge-ctx');
    const domains = checkedItems([
      'ge-escopo',
      'ge-riscos',
      'ge-okr',
      'ge-fluxo',
      'ge-modelo',
      'ge-stake',
    ]);
    const domainLabels = {
      'ge-escopo':
        'Escopo e EAP (declaracao de escopo, Work Breakdown Structure, prevencao de scope creep)',
      'ge-riscos':
        'Gerenciamento de Riscos (identificacao, probabilidade, impacto, respostas: evitar/transferir/mitigar/aceitar)',
      'ge-okr':
        'OKR e Alinhamento Estrategico (Key Results quantitativos, orientados a resultado, nao apenas entregas)',
      'ge-fluxo':
        'Fluxo e Entrega (Lead Time, Throughput, Work in Progress, limites de WIP, Lei de Little)',
      'ge-modelo':
        'Modelo de Gestao (tradicional, agil ou hibrido — analise de complexidade e maturidade)',
      'ge-stake':
        'Stakeholders e Comunicacao (mapeamento poder/interesse, Project Charter, plano de comunicacao)',
    };
    let p = `Analise detalhadamente o repositorio ${repo}.\n\n`;
    p += `CONTEXTO: ${ctx}\n\n`;
    p += `INSTRUCAO DE DOMINIO — Avalie o projeto considerando os seguintes aspectos de gestao:\n\n`;
    domains.forEach((_, i) => {
      p += `${i + 1}. ${domainLabels[_]}\n`;
    });
    p += `\nREGRAS OBRIGATORIAS:\n- Verifique se o escopo esta claramente definido e alinhado com entregas reais\n`;
    p += `- Identifique riscos tecnicos e de negocio com probabilidade e impacto\n`;
    p += `- Avalie se as metricas medem impacto real no negocio (eficacia), nao apenas produtividade (eficiencia)\n`;
    p += `- Recomende o modelo de gestao mais adequado baseado na complexidade\n`;
    p += `\nFORMATO DE RESPOSTA:\n1. Analise de escopo e aderencia a EAP\n`;
    p += `2. Matriz de riscos (probabilidade x impacto) com plano de mitigacao\n`;
    p += `3. Avaliacao de OKRs e alinhamento estrategico\n`;
    p += `4. Metricas de fluxo (Lead Time, Throughput, WIP)\n`;
    p += `5. Recomendacao de modelo de gestao\n`;
    p += `6. Plano de comunicacao e gestao de stakeholders\n`;
    return p;
  },
};
