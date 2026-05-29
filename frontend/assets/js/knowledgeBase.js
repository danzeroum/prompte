// knowledgeBase.js — base de conhecimento dos ebooks, em módulo ES puro e
// testável (sem DOM). Estrutura os `insights` dos 20 ebooks catalogados em
// index.html numa forma consultável e fornece `appendKnowledge()`, a camada
// ADITIVA e opt-in que enriquece um prompt já montado por generators.js.
//
// Carregado sob demanda (dynamic import via window.PE.ensureKnowledge), então
// NÃO importa generators.js — o casamento template→domínios é feito pelo nome
// de exibição do template (mesmo valor usado no campo `prompts:[...]` dos
// ebooks), evitando puxar os 78KB de generators.js para este chunk.

// ─── Fonte única: ebooks (espelha o array `ebooks` de index.html) ───
// Cada insight tem { domain, text }; `prompts` lista os templates do gerador a
// que o ebook se aplica (pelo nome de exibição).
export const EBOOKS = [
  {
    id: 'e-devops',
    title: 'DevOps e Integracao Continua',
    prompts: ['Revisao e Correcao', 'Melhoria / Refatoracao', 'Revisao + Qualidade'],
    insights: [
      {
        domain: 'Observabilidade',
        text: 'Solicite logs estruturados, metricas e tracing para cada problema reportado. Exija que a LLM identifique gargalos usando os tres pilares da observabilidade e sugira instrumentacao apropriada.',
        levels: {
          pratico:
            'Entregue um checklist dos tres pilares (logs estruturados, metricas, tracing) e os trechos de instrumentacao prontos para cada gargalo identificado.',
          intermediario:
            'Para cada gargalo, justifique qual pilar da observabilidade o revela e o trade-off entre custo de instrumentacao e visibilidade obtida.',
          academico:
            'Fundamente nos tres pilares da observabilidade e na distincao monitoring vs observability, citando praticas de SRE (SLI/SLO).',
        },
      },
      {
        domain: 'CI/CD Pipeline',
        text: 'Quando revisar codigo de deploy, referencie as etapas do pipeline (build, test, stage, deploy). Peça validacao em cada estagio e rollback automatizado.',
        levels: {
          pratico:
            'Liste as etapas do pipeline (build, test, stage, deploy) com o gate de validacao e o rollback automatizado de cada uma, prontos para configurar.',
          intermediario:
            'Justifique os criterios de promocao entre estagios e o trade-off entre velocidade de deploy e seguranca (gates manuais vs automaticos).',
          academico:
            'Fundamente em Continuous Delivery (Humble/Farley) e nas metricas DORA (deploy frequency, lead time, MTTR, change fail rate).',
        },
      },
      {
        domain: 'Seguranca no Codigo',
        text: 'Exija que o codigo siga o SAMM (OpenSAMM) nas 5 dimensoes: Governanca, Design, Implementacao, Verificacao e Operacao.',
        levels: {
          pratico:
            'Aplique um checklist das 5 dimensoes do OpenSAMM (Governanca, Design, Implementacao, Verificacao, Operacao) com a acao corretiva de cada lacuna.',
          intermediario:
            'Para cada dimensao do SAMM, justifique o nivel de maturidade observado e priorize as lacunas pelo risco que mitigam.',
          academico:
            'Fundamente no modelo OpenSAMM e em maturity models de seguranca, relacionando cada dimensao ao ciclo de vida seguro (SDL).',
        },
      },
      {
        domain: 'Microservicos',
        text: 'Para arquiteturas de microservicos, exija mapeamento de dependencias, interface contracts e strategy patterns para desacoplamento.',
        levels: {
          pratico:
            'Entregue o mapa de dependencias, os contratos de interface e os pontos de desacoplamento (strategy) com os diffs sugeridos.',
          intermediario:
            'Justifique cada fronteira de servico pelo acoplamento/coesao e aponte o trade-off entre granularidade e overhead de comunicacao.',
          academico:
            'Fundamente em bounded contexts (DDD) e nos padroes de Newman, discutindo consistencia eventual e contract testing.',
        },
      },
    ],
  },
  {
    id: 'e-td',
    title: 'Transformacao Digital dos Negocios',
    prompts: ['Analise Geral', 'Analise Especifica', 'Revisao + Qualidade'],
    insights: [
      {
        domain: 'Customer-Centric',
        text: 'Sempre que o prompt envolver interacao com usuario final, solicite que a LLM avalie o impacto na experiencia do cliente e proponha melhorias baseadas em journey maps.',
        levels: {
          pratico:
            'Liste os pontos de impacto na experiencia do cliente e proponha melhorias concretas ancoradas em um journey map.',
          intermediario:
            'Justifique cada melhoria pelo efeito na jornada do cliente e o trade-off com custo/esforco de implementacao.',
          academico:
            'Fundamente em Customer Experience e Design Thinking, citando journey mapping e jobs-to-be-done.',
        },
      },
      {
        domain: 'Data-Driven',
        text: 'Exija que a LLM justifique decisoes com dados, metricas ou evidencias. Solicite KPIs, dashboards e hipoteses mensuraveis.',
        levels: {
          pratico:
            'Entregue os KPIs, o dashboard sugerido e as hipoteses mensuraveis que sustentam cada decisao.',
          intermediario:
            'Justifique a escolha de cada metrica e o trade-off entre indicadores de vaidade e metricas acionaveis.',
          academico:
            'Fundamente em cultura data-driven e no metodo cientifico aplicado a produto (hipotese, experimento, evidencia).',
        },
      },
      {
        domain: 'Cultura de Inovacao',
        text: 'Para requests de novos projetos, peça a LLM considerar elementos de cultura organizacional, modelos de maturidade digital e learning plans ao inves de business plans.',
        levels: {
          pratico:
            'Liste elementos de cultura e um learning plan acionavel, substituindo o business plan por hipoteses a validar.',
          intermediario:
            'Justifique as escolhas culturais pelo estagio de maturidade digital e o trade-off entre exploracao e execucao.',
          academico:
            "Fundamente em modelos de maturidade digital e em ambidestria organizacional (March, O'Reilly).",
        },
      },
      {
        domain: 'Ecossistema',
        text: 'Para analises de repositorio, inclua perspectivas de ecossistema: como o codigo interage com parceiros, fornecedores e outros servicos.',
        levels: {
          pratico:
            'Mapeie as integracoes com parceiros, fornecedores e servicos externos e os pontos de acoplamento a revisar.',
          intermediario:
            'Justifique as fronteiras do ecossistema e o trade-off entre dependencia externa e controle interno.',
          academico:
            'Fundamente em plataformas e ecossistemas de negocio (platform economics, redes de valor).',
        },
      },
    ],
  },
  {
    id: 'e-ux',
    title: 'UX no Desenvolvimento de Software',
    prompts: ['Revisao + Qualidade', 'UX + Usabilidade'],
    insights: [
      {
        domain: 'Usabilidade Heuristica',
        text: 'Para qualquer revisao de interface, peça analise heuristica (Nielsen) cobrindo: facilidade de aprender, eficiencia, retencao, erros e satisfacao.',
        levels: {
          pratico:
            'Aplique as heuristicas de Nielsen como checklist (aprender, eficiencia, retencao, erros, satisfacao) apontando violacoes e correcoes.',
          intermediario:
            'Para cada violacao heuristica, justifique a severidade e o trade-off de design da correcao proposta.',
          academico:
            'Fundamente nas 10 heuristicas de Nielsen e em principios de usabilidade (Norman), citando severity ratings.',
        },
      },
      {
        domain: 'Design Centrado no Usuario',
        text: 'Solicite que a LLM considere o processo completo de design: empatizar, definir, idear, prototipar e testar — nao apenas o codigo.',
        levels: {
          pratico:
            'Percorra as 5 fases (empatizar, definir, idear, prototipar, testar) com a entrega concreta de cada uma.',
          intermediario:
            'Justifique como cada fase reduz risco de produto e o trade-off entre profundidade de pesquisa e velocidade.',
          academico:
            'Fundamente em Design Thinking (d.school/IDEO) e em User-Centered Design (ISO 9241-210).',
        },
      },
      {
        domain: 'Prototipacao Rapida',
        text: 'Sempre inclua no prompt a solicitacao de prototipos como ferramenta de co-criacao, nao apenas validacao. Peça Crazy 8s ou prototipos de baixa fidelidade.',
        levels: {
          pratico:
            'Proponha prototipos de baixa fidelidade (ex.: Crazy 8s) como co-criacao, com o que validar em cada um.',
          intermediario:
            'Justifique a fidelidade escolhida pelo objetivo de aprendizado e o trade-off custo vs realismo.',
          academico: 'Fundamente em prototyping fidelity e no ciclo build-measure-learn (Lean UX).',
        },
      },
      {
        domain: 'Arquitetura de Informacao',
        text: 'Para revisar interfaces, solicite avaliacao da arquitetura de informacao: organizacao, navegacao, rotulacao e hierarquia dos conteudos.',
        levels: {
          pratico:
            'Avalie organizacao, navegacao, rotulacao e hierarquia, entregando a estrutura de IA revisada.',
          intermediario:
            'Justifique a taxonomia proposta pela tarefa do usuario e o trade-off entre profundidade e largura de navegacao.',
          academico:
            'Fundamente em Information Architecture (Rosenfeld/Morville) e em modelos mentais de categorizacao.',
        },
      },
    ],
  },
  {
    id: 'e-api',
    title: 'Projeto e Arquitetura de APIs',
    prompts: ['Design de API', 'Canivete Suico'],
    insights: [
      {
        domain: 'API Design Principles',
        text: 'Exija que a LLM avalie: substantivos autoexplicativos, metodos HTTP corretos (GET/POST/PUT/PATCH/DELETE), feedback informativo e exemplos de resposta.',
        levels: {
          pratico:
            'Verifique substantivos, metodos HTTP, feedback e exemplos de resposta, entregando a especificacao corrigida.',
          intermediario:
            'Justifique cada escolha de recurso/metodo e o trade-off entre pragmatismo e pureza REST.',
          academico:
            'Fundamente em REST (Fielding), no Richardson Maturity Model e em principios de API design.',
        },
      },
      {
        domain: 'Anti-Patterns de API',
        text: 'Sempre inclua verificacao de anti-patterns: falta de versionamento, documentacao ausente, sem rate limiting, logs nao registrados e endpoints nao documentados.',
        levels: {
          pratico:
            'Liste anti-patterns presentes (sem versionamento, sem docs, sem rate limiting, sem logs) com a correcao de cada.',
          intermediario:
            'Priorize os anti-patterns pelo risco operacional e justifique o trade-off de corrigir cada um agora.',
          academico:
            'Fundamente em catalogos de API anti-patterns e em principios de robustez (Postel) e governanca de API.',
        },
      },
      {
        domain: 'Observabilidade (Logs/Metricas/Traces)',
        text: 'Solicite que o prompt inclua requisitos de observabilidade: logs estruturados com contexto, metricas de desempenho e tracing de requisicoes.',
        levels: {
          pratico:
            'Inclua requisitos de logs estruturados com contexto, metricas de desempenho e tracing, prontos para a API.',
          intermediario:
            'Justifique o que instrumentar em cada endpoint e o trade-off entre cardinalidade de metricas e custo.',
          academico:
            'Fundamente nos tres pilares e na correlacao via trace context (W3C), distinguindo os metodos RED e USE.',
        },
      },
      {
        domain: 'Plugin Architecture',
        text: 'Para sistemas extensiveis, solicite avaliacao de: ponto de entrada, interfaces de comunicacao (hooks/APIs), gerenciamento de ciclo de vida e compatibilidade.',
        levels: {
          pratico:
            'Defina ponto de entrada, interfaces (hooks/APIs), ciclo de vida e compatibilidade, com o contrato pronto.',
          intermediario:
            'Justifique a fronteira de extensao e o trade-off entre flexibilidade e estabilidade do contrato.',
          academico: 'Fundamente em microkernel/plugin patterns e no principio Open/Closed.',
        },
      },
    ],
  },
  {
    id: 'e-arch',
    title: 'Arquitetura de Software',
    prompts: ['Refatoracao Arquitetural', 'Revisao + Qualidade', 'Design de API'],
    insights: [
      {
        domain: 'Atributos de Qualidade (-ilities)',
        text: 'Solicite que a LLM identifique e documente os atributos de qualidade relevantes: escalabilidade, performance, seguranca, disponibilidade, manutenibilidade, testabilidade.',
        levels: {
          pratico:
            'Liste os -ilities relevantes (escalabilidade, performance, seguranca, manutenibilidade) com como verificar cada um.',
          intermediario:
            'Justifique a priorizacao dos atributos pelo contexto e os trade-offs entre eles (ex.: performance vs manutenibilidade).',
          academico:
            'Fundamente em quality attributes (ISO 25010) e em ATAM/cenarios de qualidade (Bass, Clements, Kazman).',
        },
      },
      {
        domain: 'Leis da Arquitetura',
        text: 'Sempre inclua: "Toda decisao tem seu preco" e "Uma decisao so pode ser avaliada em relacao ao seu contexto". Peça trade-offs explicitos.',
        levels: {
          pratico:
            'Para cada decisao, registre o preco (trade-off) e o contexto que a justifica, de forma explicita.',
          intermediario:
            'Justifique as decisoes confrontando alternativas e tornando trade-offs e premissas rastreaveis via ADRs.',
          academico:
            "Fundamente nas leis 'todo trade-off tem preco' e 'depende do contexto' (Richards/Ford) e em Architecture Decision Records.",
        },
      },
      {
        domain: 'Documentacao C4/4+1',
        text: 'Para qualquer analise, solicite documentacao nos niveis C4: Contexto, Container, Componente e Codigo. Para revisoes, inclua diagramas de sequencia (Cenarios).',
        levels: {
          pratico:
            'Entregue os 4 niveis C4 (Contexto, Container, Componente, Codigo) e diagramas de sequencia dos cenarios chave.',
          intermediario:
            'Justifique o nivel de detalhe de cada diagrama pela audiencia e o trade-off entre completude e manutencao.',
          academico:
            'Fundamente no modelo C4 (Brown) e na visao 4+1 (Kruchten), relacionando views a stakeholders.',
        },
      },
      {
        domain: 'Refatoracao',
        text: 'Solicite analise de oportunidades de refatoracao com: reducao de acoplamento, automacao de testes, identificacao de padroes emergentes e planejamento escalavel.',
        levels: {
          pratico:
            'Liste oportunidades de refatoracao (acoplamento, testes, padroes emergentes) com o diff de cada uma.',
          intermediario:
            'Justifique cada refatoracao pelo ganho de manutenibilidade e o trade-off com o risco de regressao.',
          academico:
            'Fundamente em Refactoring (Fowler), em code smells e no ciclo red-green-refactor.',
        },
      },
    ],
  },
  {
    id: 'e-analytics',
    title: 'Analytics em Negocios e Tomada de Decisao',
    prompts: ['Analise Geral', 'Analise Especifica', 'Revisao + Qualidade'],
    insights: [
      {
        domain: 'Analise Descritiva',
        text: 'Antes de qualquer analise preditiva, solicite que a LLM faca analise descritiva: medidas de posicao (media, mediana, moda), dispersao (desvio padrao) e identificacao de outliers.',
        levels: {
          pratico:
            'Calcule medidas de posicao (media, mediana, moda), dispersao e identifique outliers, entregando o resumo.',
          intermediario:
            'Justifique a escolha das estatisticas pela distribuicao dos dados e o trade-off media vs mediana com outliers.',
          academico:
            'Fundamente em estatistica descritiva e em EDA (Tukey), discutindo robustez a outliers.',
        },
      },
      {
        domain: 'Inferencia e Teste de Hipotese',
        text: 'Para recomendacoes, solicite que a LLM formule hipoteses testaveis com nivel de significancia definido (alpha), considerando erros tipo I e II.',
        levels: {
          pratico:
            'Formule hipoteses testaveis com alpha definido e indique o teste e a decisao para cada uma.',
          intermediario:
            'Justifique o nivel de significancia e o trade-off entre erros tipo I e II (poder do teste).',
          academico:
            'Fundamente em inferencia frequentista (Fisher/Neyman-Pearson): p-valor, poder e tamanho de efeito.',
        },
      },
      {
        domain: 'Regressao Linear',
        text: 'Para analises correlacionais, solicite modelos de regressao com metricas de qualidade (R2 ajustado), teste F para significancia geral e teste t para parametros individuais.',
        levels: {
          pratico:
            'Ajuste o modelo e entregue R2 ajustado, teste F e testes t dos coeficientes com a interpretacao.',
          intermediario:
            'Justifique as variaveis incluidas e o trade-off entre ajuste e parcimonia (multicolinearidade, overfitting).',
          academico:
            'Fundamente em MQO, nos pressupostos de Gauss-Markov e em diagnostico de residuos.',
        },
      },
      {
        domain: 'Amostragem',
        text: 'Solicite definicao de plano de amostragem: objetivo, populacao-alvo, metodo (aleatoria simples, estratificada, sistematica) e tamanho adequado.',
        levels: {
          pratico:
            'Defina objetivo, populacao-alvo, metodo (aleatoria, estratificada, sistematica) e tamanho da amostra.',
          intermediario:
            'Justifique o metodo pela estrutura da populacao e o trade-off entre custo e erro amostral.',
          academico:
            'Fundamente em teoria de amostragem (probabilistica vs nao), margem de erro e nivel de confianca.',
        },
      },
    ],
  },
  {
    id: 'e-priv',
    title: 'Privacy by Design / LGPD',
    prompts: ['Seguranca + LGPD', 'Canivete Suico'],
    insights: [
      {
        domain: '7 Principios PbD',
        text: 'Exija que o codigo siga: (1) Proativo e Preventivo, (2) Privacy by Default, (3) Privacidade no Design, (4) Soma Positiva, (5) Transparencia, (6) Seguranca Ponta-a-Ponta, (7) Centrado no Usuario.',
        levels: {
          pratico:
            'Verifique os 7 principios Privacy by Design como checklist, apontando onde o codigo falha e a correcao.',
          intermediario:
            'Justifique a aplicacao de cada principio e o trade-off entre privacidade e funcionalidade/coleta de dados.',
          academico:
            'Fundamente nos 7 Foundational Principles de Cavoukian e em Privacy Engineering.',
        },
      },
      {
        domain: 'Bases Legais LGPD',
        text: 'Sempre que envolver dados, solicite que a LLM identifique a base legal aplicavel (consentimento, obrigacao legal, interesse legitimo, etc.) e documente a justificativa.',
        levels: {
          pratico:
            'Para cada uso de dado, identifique a base legal aplicavel e documente a justificativa, pronta para registro.',
          intermediario:
            'Justifique a base legal escolhida frente a alternativas e o trade-off (consentimento vs legitimo interesse).',
          academico:
            'Fundamente nos arts. 7 e 11 da LGPD e no GDPR, discutindo o teste de legitimo interesse (LIA).',
        },
      },
      {
        domain: 'Dados Pessoais vs Sensiveis',
        text: 'Solicite classificacao adequada: dados pessoais vs. dados sensiveis. Para sensiveis, exija protecao adicional e justificativa de processamento.',
        levels: {
          pratico:
            'Classifique cada dado (pessoal vs sensivel) e defina a protecao adicional exigida para os sensiveis.',
          intermediario:
            'Justifique a classificacao e o trade-off entre minimizacao de dados e necessidade de negocio.',
          academico:
            'Fundamente na distincao legal (art. 5 da LGPD) e em data minimization/purpose limitation.',
        },
      },
      {
        domain: 'Incidentes de Seguranca',
        text: 'Para qualquer alteracao, solicite analise de cenarios de incidente, plano de resposta e cadeia de evidencias para auditoria.',
        levels: {
          pratico:
            'Descreva cenarios de incidente, o plano de resposta e a cadeia de evidencias para auditoria.',
          intermediario:
            'Justifique as prioridades de resposta pelo impacto e o trade-off entre conter rapido e preservar evidencia.',
          academico:
            'Fundamente em incident response (NIST SP 800-61) e em forensics/chain of custody.',
        },
      },
    ],
  },
  {
    id: 'e-qual',
    title: 'Garantia e Controle de Qualidade',
    prompts: ['Revisao + Qualidade', 'Melhoria / Refatoracao'],
    insights: [
      {
        domain: 'Verificacao e Validacao',
        text: 'Sempre solicite que a LLM separe V&V: verificacao (esta correto?) e validacao (e o que deveria fazer?). Ambos devem ser aplicados em cada nivel.',
        levels: {
          pratico:
            "Separe V&V por nivel: verifique 'esta correto?' e valide 'faz o que deveria?', com os testes de cada.",
          intermediario:
            'Justifique onde aplicar verificacao vs validacao e o trade-off de esforco por nivel de risco.',
          academico: 'Fundamente na distincao V&V (IEEE 1012) e no V-model de desenvolvimento.',
        },
      },
      {
        domain: 'Niveis de Teste',
        text: 'Exija cobertura em todos os niveis: unidade, integracao, sistema e aceitacao. Para cada nivel, peça foco em limites, riscos e areas de maior complexidade.',
        levels: {
          pratico:
            'Cubra unidade, integracao, sistema e aceitacao, com foco em limites e areas de maior complexidade.',
          intermediario:
            'Justifique a distribuicao de testes entre niveis e o trade-off custo/feedback (piramide de testes).',
          academico:
            'Fundamente na test pyramid (Cohn) e em test levels (ISTQB), discutindo cobertura vs valor.',
        },
      },
      {
        domain: 'TDD/BDD',
        text: 'Para codigo novo, solicite que a LLM gere ou valide usando TDD (Test-Driven Development) ou BDD (Behavior-Driven Development) com Given/When/Then.',
        levels: {
          pratico:
            'Gere ou valide com TDD/BDD: escreva o teste/cenario Given-When-Then antes e entregue o codigo que passa.',
          intermediario:
            'Justifique quando usar TDD vs BDD e o trade-off entre cobertura de unidade e especificacao de comportamento.',
          academico:
            'Fundamente em TDD (Beck) e BDD (North), relacionando specification by example e living documentation.',
        },
      },
      {
        domain: 'Analise Estatica e SAST',
        text: 'Solicite analise estatica automatizada para detectar: codigo morto, duplicado, complexidade ciclomatica alta, vulnerabilidades OWASP e violacoes de padroes de codificacao.',
        levels: {
          pratico:
            'Rode analise estatica e liste codigo morto, duplicado, complexidade alta e vulnerabilidades OWASP com a correcao.',
          intermediario:
            'Priorize os achados pelo risco e justifique o trade-off entre ruido de falso positivo e cobertura.',
          academico:
            'Fundamente em static analysis, no OWASP Top 10 e em metricas de complexidade (McCabe).',
        },
      },
    ],
  },
  {
    id: 'e-algo',
    title: 'Algoritmos e Padroes de Projetos',
    prompts: [
      'Revisao + Qualidade',
      'Melhoria / Refatoracao',
      'Refatoracao Arquitetural',
      'Canivete Suico',
    ],
    insights: [
      {
        domain: 'SOLID',
        text: 'Exija verificacao de todos os 5 principios: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation e Dependency Inversion.',
        // `levels` (opcional): texto sob medida por profundidade. Quando ausente,
        // appendKnowledge usa `text` + o sufixo do nivel. Exemplo de referencia.
        levels: {
          pratico:
            'Liste as violacoes de cada um dos 5 principios SOLID (SRP, OCP, LSP, ISP, DIP) e entregue o diff de correcao de cada uma.',
          intermediario:
            'Avalie os 5 principios SOLID (SRP, OCP, LSP, ISP, DIP), justificando cada violacao pelo impacto em acoplamento e coesao, com o trecho antes/depois.',
          academico:
            'Avalie os 5 principios SOLID com fundamentacao (Martin/Meyer): para cada violacao, explique o principio, o exemplo canonico, a consequencia de design e o refactoring recomendado.',
        },
      },
      {
        domain: 'Design Patterns',
        text: 'Identifique padroes aplicaveis: criacionais (Factory, Singleton, Builder), estruturais (Adapter, Decorator, Facade) e comportamentais (Strategy, Observer, Template Method).',
        levels: {
          pratico:
            'Identifique padroes aplicaveis (criacionais, estruturais, comportamentais) e mostre como aplica-los no codigo.',
          intermediario:
            'Justifique cada padrao pelo problema que resolve e o trade-off com a complexidade adicionada.',
          academico:
            'Fundamente nos padroes GoF (intencao/consequencias) e em quando NAO usa-los (over-engineering).',
        },
      },
      {
        domain: 'Complexidade Big-O',
        text: 'Sempre que envolver performance, solicite analise de complexidade temporal (Big-O) e compare estruturas de dados para o caso de uso especifico.',
        levels: {
          pratico:
            'Calcule a complexidade temporal (Big-O) e compare estruturas de dados para o caso de uso, com a escolha.',
          intermediario:
            'Justifique a estrutura escolhida pelo padrao de acesso e o trade-off tempo vs espaco.',
          academico:
            'Fundamente em analise assintotica (O, Theta, Omega) e em complexidade amortizada.',
        },
      },
      {
        domain: 'Clean Code + 12-Factor',
        text: 'Solicite aderencia a clean code (nomes descritivos, funcoes curtas, sem duplicacao) e aos 12 fatores app (base de codigo rastreavel, configuracoes no ambiente, logs como eventos).',
        levels: {
          pratico:
            'Aplique clean code (nomes, funcoes curtas, sem duplicacao) e os 12 fatores como checklist, com diffs.',
          intermediario:
            'Justifique cada ajuste pela legibilidade/portabilidade e o trade-off com o tempo de refatoracao.',
          academico: 'Fundamente em Clean Code (Martin) e na metodologia 12-Factor App (Wiggins).',
        },
      },
    ],
  },
  {
    id: 'e-proc',
    title: 'Sistemas Orientados a Processos',
    prompts: ['Analise Geral', 'Revisao + Qualidade'],
    insights: [
      {
        domain: 'Modelagem BPMN',
        text: 'Para workflows, solicite modelagem BPMN com: eventos claros, gateways corretos (XOR/OR/AND), swimlanes para atores diferentes e subprocessos bem definidos.',
        levels: {
          pratico:
            'Modele o workflow em BPMN com eventos, gateways (XOR/OR/AND), swimlanes e subprocessos, pronto para revisar.',
          intermediario:
            'Justifique a escolha de cada gateway e o trade-off entre detalhamento do modelo e legibilidade.',
          academico:
            'Fundamente na especificacao BPMN 2.0 (OMG) e em workflow patterns (van der Aalst).',
        },
      },
      {
        domain: 'DMN (Decision Tables)',
        text: 'Para logica de negocio, solicite que decisoes complexas sejam modeladas em DMN (Decision Model and Notation) separando regras de negocio do codigo.',
        levels: {
          pratico:
            'Extraia as regras de negocio para tabelas de decisao DMN, separando-as do codigo.',
          intermediario:
            'Justifique a separacao regra/codigo e o trade-off entre flexibilidade e governanca das regras.',
          academico: 'Fundamente na especificacao DMN (OMG) e em business rules management (BRMS).',
        },
      },
      {
        domain: 'Process Mining',
        text: 'Solicite que a LLM sugira uso de process mining nos logs existentes para descobrir o "processo real" vs o "processo documentado" antes de propor mudancas.',
        levels: {
          pratico:
            'Use process mining nos logs para revelar o processo real e compare com o documentado antes de mudar.',
          intermediario:
            'Justifique as divergencias encontradas e o trade-off entre padronizar e acomodar variantes uteis.',
          academico:
            'Fundamente em process mining (van der Aalst): discovery, conformance e enhancement.',
        },
      },
      {
        domain: 'Orquestracao BPMS',
        text: 'Para automacao, solicite design de orquestracao com: chamadas sincronas e assincronas (digital workers), acoplamento fraco via REST API e tolerancia a falhas.',
        levels: {
          pratico:
            'Desenhe a orquestracao com chamadas sincronas/assincronas, acoplamento fraco via REST e tolerancia a falhas.',
          intermediario:
            'Justifique sincrono vs assincrono por etapa e o trade-off entre latencia e resiliencia.',
          academico:
            'Fundamente em orchestration vs choreography e em padroes de saga/compensacao.',
        },
      },
    ],
  },
  {
    id: 'e-cloud',
    title: 'Computacao em Nuvem',
    prompts: ['Revisao e Correcao', 'Refatoracao Arquitetural', 'Canivete Suico'],
    insights: [
      {
        domain: 'Seguranca na Nuvem',
        text: 'Solicite que a LLM avalie se o codigo segue o modelo de responsabilidade compartilhada da nuvem, verificando configuracoes de seguranca (IAM, flags de protecao, criptografia) e se estao devidamente implementadas.',
        levels: {
          pratico:
            'Verifique IAM, criptografia e flags de protecao no modelo de responsabilidade compartilhada, com correcoes.',
          intermediario:
            'Justifique os controles pelo limite de responsabilidade do provedor e o trade-off seguranca vs agilidade.',
          academico:
            'Fundamente no Shared Responsibility Model e em frameworks como CIS Benchmarks e Well-Architected.',
        },
      },
      {
        domain: 'Modelos de Servico',
        text: 'Quando revisar codigo hospedado em nuvem, exija que a LLM identifique qual modelo de servico (SaaS, PaaS, IaaS ou FaaS) esta sendo utilizado e se os recursos estao provisionados de forma otimizada (Pay as you Go).',
        levels: {
          pratico:
            'Identifique o modelo (SaaS/PaaS/IaaS/FaaS) e verifique se os recursos estao otimizados (Pay as you Go).',
          intermediario:
            'Justifique o modelo adequado pela carga e o trade-off entre controle e gestao operacional.',
          academico:
            'Fundamente na taxonomia NIST de cloud computing e na economia de elasticidade.',
        },
      },
      {
        domain: 'Migracao e Adocao',
        text: 'Inclua verificacao dos 6 pilares de preparacao para migracao em nuvem (negocios, pessoas, governanca, plataforma, seguranca, operacoes) e solicite a LLM que avalie se o codigo esta pronto para ambientes cloud-native.',
        levels: {
          pratico:
            'Avalie os 6 pilares de preparacao (negocios, pessoas, governanca, plataforma, seguranca, operacoes) com gaps.',
          intermediario:
            'Justifique a estrategia de migracao (6 Rs) e o trade-off entre rehospedar e replataformar.',
          academico:
            'Fundamente em Cloud Adoption Frameworks e nas 6 Rs de migracao (Gartner/AWS).',
        },
      },
      {
        domain: 'Compliance e Regulacao',
        text: 'Exija que a LLM verifique se o codigo atende aos requisitos de conformidade aplicaveis (LGPD, resolucao BACEN 4.658, NIST CSF) e se implementa praticas de seguranca by design, como criptografia em escala e resiliencia global.',
        levels: {
          pratico:
            'Verifique conformidade aplicavel (LGPD, BACEN 4.658, NIST CSF) e praticas de security by design, com lacunas.',
          intermediario:
            'Priorize as exigencias por risco regulatorio e justifique o trade-off de implementar cada controle.',
          academico:
            'Fundamente em frameworks de compliance (NIST CSF) e na regulacao setorial aplicavel.',
        },
      },
    ],
  },
  {
    id: 'e-requisitos',
    title: 'Engenharia de Requisitos em Sistemas de Informacoes',
    prompts: ['Analise Geral', 'Revisao + Qualidade', 'Canivete Suico'],
    insights: [
      {
        domain: 'Historias de Usuario',
        text: 'Solicite que a LLM avalie se as historias de usuario no codigo seguem as caracteristicas INVEST (Independente, Negociavel, Valiosa, Estimavel, Pequena, Testavel) e se possuem criterios de aceitacao bem definidos.',
        levels: {
          pratico:
            'Verifique INVEST em cada historia e os criterios de aceitacao, reescrevendo as que falharem.',
          intermediario:
            'Justifique os ajustes pela testabilidade/valor e o trade-off entre granularidade e contexto.',
          academico: 'Fundamente em user stories (Cohn) e nos criterios INVEST (Wake).',
        },
      },
      {
        domain: 'Requisitos Nao Funcionais',
        text: 'Quando revisar codigo, inclua verificacao explicita de requisitos nao funcionais (performance, seguranca, usabilidade, escalabilidade) e solicite a LLM que identifique gaps entre o implementado e os SLAs definidos.',
        levels: {
          pratico:
            'Liste os RNFs (performance, seguranca, usabilidade, escalabilidade) e os gaps frente aos SLAs definidos.',
          intermediario:
            'Justifique a priorizacao dos RNFs e os trade-offs entre eles no contexto do sistema.',
          academico:
            'Fundamente na taxonomia de RNFs (ISO 25010) e em engenharia de requisitos (Sommerville).',
        },
      },
      {
        domain: 'Gestao do Backlog',
        text: 'Exija que a LLM analise se a estrutura do projeto reflete um backlog de produto bem refinado, com itens ordenados por prioridade (metodo MoSCoW) e com nivel de detalhamento adequado para a sprint atual.',
        levels: {
          pratico:
            'Avalie o refinamento do backlog: itens priorizados por MoSCoW e detalhados para a sprint, com ajustes.',
          intermediario:
            'Justifique a ordenacao por valor/risco e o trade-off entre antecipar refinamento e evitar desperdicio.',
          academico:
            'Fundamente em product backlog management (Scrum) e em priorizacao MoSCoW/Kano.',
        },
      },
      {
        domain: 'Prototipagem e Validacao',
        text: 'Ao revisar funcionalidades novas, solicite que a LLM verifique se existem prototipos ou especificacoes claras que validem os requisitos antes da implementacao, e se o codigo corresponde fielmente as especificacoes documentadas.',
        levels: {
          pratico:
            'Verifique se ha prototipos/especificacoes validando os requisitos e se o codigo corresponde a eles.',
          intermediario:
            'Justifique o nivel de validacao previa e o trade-off entre antecipar prototipo e custo de retrabalho.',
          academico:
            'Fundamente em validacao de requisitos e em prototyping como reducao de incerteza.',
        },
      },
    ],
  },
  {
    id: 'e-agile',
    title: 'Metodos Ageis em Projetos de Softwares',
    prompts: ['Revisao e Correcao', 'Revisao + Qualidade', 'Canivete Suico'],
    insights: [
      {
        domain: 'BDD e Testes',
        text: 'Solicite que a LLM avalie se o codigo possui testes automatizados alinhados aos cenarios Given-When-Then do BDD, garantindo especificacao viva e feedback rapido sobre a qualidade do software.',
        levels: {
          pratico:
            'Verifique testes automatizados alinhados aos cenarios Given-When-Then, completando os que faltam.',
          intermediario:
            'Justifique a cobertura de cenarios pelo risco de negocio e o trade-off entre E2E e testes rapidos.',
          academico:
            'Fundamente em BDD (North) e em specification by example (Adzic) como documentacao viva.',
        },
      },
      {
        domain: 'Artefatos Ageis',
        text: 'Quando revisar, exija que a LLM verifique a existencia e qualidade dos artefatos ageis: Scrum Board atualizado, Grafico Burndown, Product Backlog priorizado com criterios de aceite claros e Definition of Done bem estabelecida.',
        levels: {
          pratico:
            'Confira Scrum Board, Burndown, Product Backlog priorizado e Definition of Done, apontando o que falta.',
          intermediario:
            'Justifique o valor de cada artefato e o trade-off entre cerimonia e fluxo de entrega.',
          academico: 'Fundamente no Scrum Guide e nos pilares transparencia/inspecao/adaptacao.',
        },
      },
      {
        domain: 'Metricas de Fluxo',
        text: 'Inclua em seus prompts uma avaliacao do fluxo de entrega: Lead Time, tempo de ciclo e throughput. Solicite a LLM que identifique gargalos no processo de desenvolvimento baseado nos padroes de commit e entrega.',
        levels: {
          pratico:
            'Meca Lead Time, tempo de ciclo e throughput a partir dos commits/entregas e aponte gargalos.',
          intermediario:
            'Justifique os gargalos pelos dados de fluxo e o trade-off de limitar WIP para acelerar entrega.',
          academico: 'Fundamente em flow metrics e na Lei de Little, citando Kanban (Anderson).',
        },
      },
      {
        domain: 'Valor e Priorizacao',
        text: 'Exija que a LLM analise se as funcionalidades implementadas seguem a priorizacao por valor (WSJF - Weighted Shortest Job First) e se o Cost of Delay foi considerado nas decisoes de roadmap e sequenciamento de sprints.',
        levels: {
          pratico:
            'Verifique se as entregas seguem WSJF e se o Cost of Delay foi considerado, propondo a reordenacao.',
          intermediario:
            'Justifique o ranking WSJF e o trade-off entre valor de negocio e tamanho do trabalho.',
          academico:
            'Fundamente em WSJF e Cost of Delay (Reinertsen) no contexto de lean product development.',
        },
      },
    ],
  },
  {
    id: 'e-squads',
    title: 'Formacao e Gestao de Tech Squads',
    prompts: ['Analise Geral', 'Refatoracao Arquitetural', 'Canivete Suico'],
    insights: [
      {
        domain: 'OKR e Resultados',
        text: 'Solicite que a LLM verifique se o codigo e as entregas do time estao alinhados aos OKRs definidos, distinguindo entre esforco (output) e resultado (outcome), e se os Key Results sao mensuraveis e rastreaveis.',
        levels: {
          pratico:
            'Verifique se entregas ligam-se a OKRs com Key Results mensuraveis, distinguindo output de outcome.',
          intermediario:
            'Justifique a qualidade dos KRs e o trade-off entre metas ambiciosas e alcancaveis.',
          academico: 'Fundamente em OKR (Doerr/Grove) e na distincao output vs outcome (Seiden).',
        },
      },
      {
        domain: 'Estrutura de Equipe',
        text: 'Quando revisar codigo em contexto de squads, exija que a LLM avalie se a estrutura do codigo reflete uma equipe multifuncional (5-10 membros) com autonomia e se as responsabilidades estao bem distribuidas sem dependencias externas criticas.',
        levels: {
          pratico:
            'Avalie se o codigo reflete uma squad multifuncional (5-10) com autonomia e responsabilidades distribuidas.',
          intermediario:
            'Justifique as fronteiras da equipe pelo acoplamento do sistema e o trade-off autonomia vs alinhamento.',
          academico: 'Fundamente em Team Topologies (Skelton/Pais) e na Lei de Conway.',
        },
      },
      {
        domain: 'Competencias e Perfil',
        text: 'Inclua verificacao sobre se o codigo demanda competencias presentes no perfil do squad, solicitando a LLM que identifique skills faltantes (competencias tecnicas, comunicacao, tomada de decisao) que possam impactar a entrega.',
        levels: {
          pratico:
            'Identifique skills faltantes (tecnicas, comunicacao, decisao) que o codigo demanda do squad.',
          intermediario:
            'Justifique as lacunas pelo impacto na entrega e o trade-off entre contratar e desenvolver.',
          academico: 'Fundamente em T-shaped skills e em modelos de competencia de equipe.',
        },
      },
      {
        domain: 'Dinamica de Equipe (Tuckman)',
        text: 'Exija que a LLM analise padroes de colaboracao no codigo (comunicacoes, code reviews, pair programming) e indique se o time esta em fase de Forming, Storming, Norming ou Performing (modelo de Tuckman), sugerindo acoes de melhoria.',
        levels: {
          pratico:
            'Indique a fase do time (Forming/Storming/Norming/Performing) pelos padroes de colaboracao e acoes de melhoria.',
          intermediario:
            'Justifique o diagnostico pelos sinais observados e o trade-off de intervencoes por fase.',
          academico: 'Fundamente no modelo de Tuckman e em estagios de desenvolvimento de grupos.',
        },
      },
    ],
  },
  {
    id: 'e-lideranca',
    title: 'Lideranca e Gestao de Pessoas',
    prompts: ['Analise Geral', 'Refatoracao Arquitetural', 'Canivete Suico'],
    insights: [
      {
        domain: 'Gestao de Mudancas (Kotter)',
        text: 'Solicite que a LLM avalie mudancas no codigo sob a perspectiva das 8 etapas de Kotter, verificando se ha senso de urgencia, coalizao de apoio, comunicacao da visao, empoderamento, vitorias de curto prazo e consolidacao na cultura.',
        levels: {
          pratico:
            'Avalie a mudanca pelas 8 etapas de Kotter (urgencia, coalizao, visao, empoderamento, vitorias) com lacunas.',
          intermediario:
            'Justifique as etapas mais fracas e o trade-off entre velocidade da mudanca e adesao das pessoas.',
          academico:
            'Fundamente no modelo de 8 etapas de Kotter e em teoria de change management (Lewin).',
        },
      },
      {
        domain: 'Cultura Organizacional',
        text: 'Quando revisar processos e padroes de codigo, exija que a LLM identifique se os elementos visiveis da cultura (politicas, procedimentos, estrutura) e os invisiveis (valores, crencas, pressupostos) estao alinhados com as praticas de desenvolvimento.',
        levels: {
          pratico:
            'Identifique elementos visiveis (politicas, processos) e invisiveis (valores, crencas) e seu alinhamento com as praticas.',
          intermediario:
            'Justifique os desalinhamentos culturais e o trade-off entre mudar estrutura e mudar comportamento.',
          academico:
            'Fundamente no modelo de cultura de Schein (artefatos, valores, pressupostos).',
        },
      },
      {
        domain: 'Mobilizacao e Engajamento',
        text: 'Inclua avaliacao dos 5 fatores de mobilizacao: conceito de comunidade, comunicacao, sentimento de importancia, escolha criteriosa dos participantes e reconhecimento. Solicite que a LLM indique se o ambiente promove alto desempenho.',
        levels: {
          pratico:
            'Avalie os 5 fatores de mobilizacao (comunidade, comunicacao, importancia, escolha, reconhecimento).',
          intermediario:
            'Justifique os fatores mais fracos e o trade-off entre engajamento de curto e longo prazo.',
          academico: 'Fundamente em mobilizacao/engajamento e em motivacao intrinseca (Deci/Ryan).',
        },
      },
      {
        domain: 'Lideranca Positiva',
        text: 'Exija que a LLM analise se as decisoes tecnicas e de arquitetura refletem lideranca positiva (foco em forcas ao inves de fraquezas, otimismo, apoio ao inves de critica) e se promovem um ambiente de eliminacao do medo e busca do virtuosismo.',
        levels: {
          pratico:
            'Verifique se decisoes tecnicas refletem foco em forcas, apoio e otimismo, eliminando o medo.',
          intermediario:
            'Justifique o estilo de lideranca pelo contexto e o trade-off entre cobranca e suporte.',
          academico:
            'Fundamente em Positive Leadership (Cameron) e em psychological safety (Edmondson).',
        },
      },
    ],
  },
  {
    id: 'e-ia',
    title: 'Engenharia de Inteligencia Artificial',
    prompts: ['Revisao e Correcao', 'Revisao + Qualidade', 'Canivete Suico'],
    insights: [
      {
        domain: 'Vies e Etica',
        text: 'Solicite que a LLM avalie modelos de IA quanto a vies nos dados de treinamento, verificando se os datasets sao diversos e representativos, e se existem mecanismos de auditoria que previnam a replicacao de desigualdades sociais e discriminacao.',
        levels: {
          pratico:
            'Verifique vies nos dados de treino (diversidade, representatividade) e mecanismos de auditoria, com acoes.',
          intermediario:
            'Justifique os riscos de vies e o trade-off entre acuracia e equidade (fairness).',
          academico:
            'Fundamente em fairness em ML, nas fontes de vies e em auditoria algoritmica (Barocas/Hardt).',
        },
      },
      {
        domain: 'Qualidade dos Dados (IA)',
        text: 'Quando revisar codigo de IA/ML, exija que a LLM verifique a qualidade dos dados (completude, consistencia, veracidade), aplicando o principio "garbage in, trash out", e se a LGPD/GDPR esta sendo respeitada no tratamento de dados sensiveis.',
        levels: {
          pratico:
            "Verifique completude, consistencia e veracidade dos dados ('garbage in, trash out') e conformidade LGPD/GDPR.",
          intermediario:
            'Justifique os controles de qualidade e o trade-off entre volume e qualidade de dados rotulados.',
          academico: 'Fundamente em data quality dimensions e em data-centric AI.',
        },
      },
      {
        domain: 'Overfitting e Generalizacao',
        text: 'Inclua verificacao de overfitting e underfitting nos modelos: solicite que a LLM analise se ha separacao adequada entre treino e teste, se a metrica de avaliacao e condizente com o problema de negocio e se o modelo generaliza para dados reais.',
        levels: {
          pratico:
            'Verifique separacao treino/teste, metrica condizente e se o modelo generaliza, com os ajustes.',
          intermediario:
            'Justifique a estrategia de validacao e o trade-off entre vies e variancia (regularizacao).',
          academico:
            'Fundamente no bias-variance tradeoff e em cross-validation (Hastie/Tibshirani).',
        },
      },
      {
        domain: 'Seguranca de IA',
        text: 'Exija que a LLM avalie a robustez do modelo contra ataques adversarios (pequenas alteracoes nos dados de entrada), se ha integracao de supervisao humana em aplicacoes criticas, e se os principios de IA responsavel (transparencia, justica, privacidade, responsabilidade) sao seguidos.',
        levels: {
          pratico:
            'Avalie robustez a ataques adversarios, supervisao humana em casos criticos e principios de IA responsavel.',
          intermediario:
            'Justifique as defesas pelo perfil de ameaca e o trade-off entre robustez e desempenho.',
          academico:
            'Fundamente em adversarial ML, human-in-the-loop e nos principios de Responsible AI.',
        },
      },
    ],
  },
  {
    id: 'e-dados',
    title: 'Projeto e Arq. de Sistemas de Uso Intensivo de Dados',
    prompts: ['Analise Geral', 'Design de API', 'Refatoracao Arquitetural'],
    insights: [
      {
        domain: 'Big Data (5 Vs)',
        text: 'Solicite que a LLM avalie se a arquitetura do sistema considera os 5 Vs do Big Data (volume, velocidade, variedade, veracidade, valor) e se as decisoes de design de dados estao alinhadas ao problema de negocio definido.',
        levels: {
          pratico:
            'Avalie os 5 Vs (volume, velocidade, variedade, veracidade, valor) e se o design de dados serve ao negocio.',
          intermediario:
            'Justifique as decisoes de arquitetura por cada V e o trade-off entre velocidade e consistencia.',
          academico: 'Fundamente no modelo dos 5 Vs do Big Data e no teorema CAP.',
        },
      },
      {
        domain: 'Qualidade dos Dados (ETL)',
        text: 'Quando revisar pipelines de dados, exija que a LLM verifique o processo de ETL completo: tratamento de dados faltantes, remocao de anomalias/outliers, normalizacao, e se a integracao de multiplas fontes mantem a consistencia e a rastreabilidade.',
        levels: {
          pratico:
            'Verifique o ETL completo: dados faltantes, outliers, normalizacao e consistencia entre fontes, com correcoes.',
          intermediario:
            'Justifique as transformacoes e o trade-off entre limpeza agressiva e perda de sinal.',
          academico: 'Fundamente em data quality, em ETL/ELT e em data lineage/rastreabilidade.',
        },
      },
      {
        domain: 'Arquitetura de Microsservicos',
        text: 'Inclua avaliacao dos principios de design de microsservicos: dominio bem definido, baixo acoplamento entre servicos, independencia de deploy, e se a arquitetura suporta escalabilidade horizontal e resiliencia.',
        levels: {
          pratico:
            'Avalie dominio bem definido, baixo acoplamento, deploy independente e escalabilidade horizontal.',
          intermediario:
            'Justifique as fronteiras de servico pelos dados e o trade-off entre autonomia e consistencia.',
          academico: 'Fundamente em DDD/bounded contexts e no padrao database-per-service.',
        },
      },
      {
        domain: 'Analise e Decisao (SMART)',
        text: 'Exija que a LLM verifique se o processo analitico segue o ciclo completo (definicao do problema, coleta, preparacao, modelagem, comunicacao de resultados, feedback) e se as metricas estao definidas segundo o modelo SMART.',
        levels: {
          pratico:
            'Verifique o ciclo analitico (problema, coleta, preparacao, modelagem, comunicacao, feedback) e metricas SMART.',
          intermediario:
            'Justifique as metricas pela decisao que suportam e o trade-off entre simplicidade e completude.',
          academico: 'Fundamente no ciclo de analise de dados (CRISP-DM) e em metas SMART.',
        },
      },
    ],
  },
  {
    id: 'e-arq2',
    title: 'Arquitetura de Softwares',
    prompts: ['Refatoracao Arquitetural', 'Revisao + Qualidade', 'Design de API'],
    insights: [
      {
        domain: 'Atributos de Qualidade',
        text: 'Solicite que a LLM avalie se o codigo atende aos atributos de qualidade arquiteturais (escalabilidade, performance, seguranca, manutenibilidade) e se as decisoes arquiteturais minimizam o custo cumulativo ao longo da vida util do sistema.',
        levels: {
          pratico:
            'Verifique escalabilidade, performance, seguranca e manutenibilidade, minimizando custo cumulativo, com acoes.',
          intermediario:
            'Justifique a priorizacao dos atributos e os trade-offs arquiteturais ao longo da vida do sistema.',
          academico:
            'Fundamente em quality attributes (ISO 25010) e no custo total de propriedade arquitetural.',
        },
      },
      {
        domain: 'DevOps e Automacao',
        text: 'Quando revisar infraestrutura e deploy, exija que a LLM verifique a presenca de praticas CI/CD, automacao de testes, containers e se a cultura de iteracao continua esta refletida na pipeline de entrega do software.',
        levels: {
          pratico:
            'Verifique CI/CD, automacao de testes e containers, apontando o que falta na pipeline.',
          intermediario:
            'Justifique o grau de automacao pelo risco de mudanca e o trade-off entre velocidade e controle.',
          academico:
            'Fundamente na cultura DevOps (CALMS) e nas capacidades do State of DevOps (DORA).',
        },
      },
      {
        domain: 'Observabilidade (Arq.)',
        text: 'Inclua verificacao de observabilidade: solicite que a LLM analise se existem mecanismos de logging, tracing e monitoramento que permitam compreender o comportamento interno do sistema e identificar gargalos de performance.',
        levels: {
          pratico:
            'Verifique logging, tracing e monitoramento que expoem o comportamento interno e gargalos, com acoes.',
          intermediario:
            'Justifique o que instrumentar e o trade-off entre granularidade de telemetria e custo/overhead.',
          academico:
            'Fundamente nos tres pilares da observabilidade e em SRE (SLI/SLO/error budget).',
        },
      },
      {
        domain: 'Seguranca por Design',
        text: 'Exija que a LLM avalie se a seguranca esta integrada desde as fases iniciais do projeto (Security by Design), verificando criptografia de dados sensiveis, controles de acesso baseados em privilegios minimos e conformidade com LGPD e GDPR.',
        levels: {
          pratico:
            'Verifique criptografia de dados sensiveis, privilegios minimos e conformidade LGPD/GDPR desde o inicio.',
          intermediario:
            'Justifique os controles desde o design e o trade-off entre seguranca e velocidade de entrega.',
          academico:
            'Fundamente em Security by Design, least privilege (Saltzer/Schroeder) e threat modeling.',
        },
      },
    ],
  },
  {
    id: 'e-metricas',
    title: 'Metricas na Gestao de Projetos de Software',
    prompts: ['Analise Geral', 'Revisao + Qualidade', 'Canivete Suico'],
    insights: [
      {
        domain: 'OKR e Alinhamento Estrategico',
        text: 'Solicite que a LLM avalie se o codigo e as entregas estao conectados aos OKRs da organizacao, verificando se os Key Results sao quantitativos, mensuraveis e orientados a resultado (nao apenas a entrega/tarefas).',
        levels: {
          pratico:
            'Verifique se entregas conectam-se a OKRs com KRs quantitativos e orientados a resultado, com ajustes.',
          intermediario:
            'Justifique a qualidade dos KRs e o trade-off entre foco estrategico e flexibilidade operacional.',
          academico: 'Fundamente em OKR (Doerr) e em alinhamento estrategico (strategy execution).',
        },
      },
      {
        domain: 'Fluxo e Entrega (Little)',
        text: 'Quando revisar projetos, exija que a LLM analise metricas de fluxo como Lead Time (tempo desde a solicitacao ate a entrega), Throughput (itens entregues por periodo) e Work in Progress, identificando gargalos e sugerindo limites de WIP.',
        levels: {
          pratico:
            'Meca Lead Time, Throughput e WIP, identifique gargalos e sugira limites de WIP.',
          intermediario:
            'Justifique os limites de WIP pelos dados e o trade-off entre utilizacao e tempo de entrega.',
          academico: 'Fundamente na Lei de Little e em Kanban/teoria das filas.',
        },
      },
      {
        domain: 'Efficiency vs Effectiveness',
        text: 'Inclua avaliacao da diferenca entre eficiencia (fazer as coisas certo) e eficacia (fazer as coisas certas): solicite que a LLM verifique se as metricas do projeto medem impacto real no negocio, nao apenas produtividade ou volume de entregas.',
        levels: {
          pratico:
            'Verifique se as metricas medem impacto no negocio (eficacia), nao so produtividade (eficiencia).',
          intermediario:
            'Justifique a escolha de metricas de impacto e o trade-off entre medir saida e medir resultado.',
          academico:
            'Fundamente na distincao efficiency vs effectiveness (Drucker) e em outcome-based metrics.',
        },
      },
      {
        domain: 'Previsibilidade (Monte Carlo)',
        text: 'Exija que a LLM analise a previsibilidade do projeto usando dados historicos de ciclo de entrega e simulacoes de Monte Carlo, verificando se as estimativas de prazo sao realistas e se ha margem de erro adequada.',
        levels: {
          pratico:
            'Use dados historicos de ciclo e simulacao de Monte Carlo para estimar prazos com margem de erro.',
          intermediario:
            'Justifique a faixa de previsao e o trade-off entre estimativa pontual e probabilistica.',
          academico:
            'Fundamente em forecasting probabilistico (Monte Carlo) e em previsibilidade de fluxo (Vacanti).',
        },
      },
    ],
  },
  {
    id: 'e-gestao',
    title: 'Praticas de Gestao de Projetos de Software',
    prompts: ['Analise Geral', 'Revisao + Qualidade', 'Canivete Suico'],
    insights: [
      {
        domain: 'Escopo e EAP',
        text: 'Solicite que a LLM verifique se o escopo do projeto esta claramente definido (declaracao de escopo) e se a EAP (Work Breakdown Structure) esta alinhada com as entregas reais do codigo, evitando scope creep e entregas nao planejadas.',
        levels: {
          pratico:
            'Verifique a declaracao de escopo e a EAP frente as entregas reais, apontando scope creep.',
          intermediario:
            'Justifique a decomposicao da EAP e o trade-off entre detalhamento e flexibilidade de escopo.',
          academico: 'Fundamente em gerenciamento de escopo e WBS (PMBOK).',
        },
      },
      {
        domain: 'Gerenciamento de Riscos',
        text: 'Quando revisar projetos, exija que a LLM identifique riscos tecnicos e de negocio (com probabilidade e impacto), e se as respostas aos riscos (evitar, transferir, mitigar, aceitar) estao documentadas e sendo monitoradas ativamente.',
        levels: {
          pratico:
            'Identifique riscos (probabilidade x impacto) e as respostas (evitar, transferir, mitigar, aceitar) monitoradas.',
          intermediario:
            'Justifique a priorizacao de riscos e o trade-off entre custo de mitigacao e exposicao.',
          academico:
            'Fundamente em risk management (PMBOK) e em analise qualitativa/quantitativa de riscos.',
        },
      },
      {
        domain: 'Modelo de Gestao (PMBOK)',
        text: 'Inclua avaliacao de qual modelo de gestao e mais adequado (tradicional, agil ou hibrido): solicite que a LLM analise a complexidade do projeto, o nivel de mudanca nos requisitos e a maturidade da organizacao para recomendar o modelo ideal.',
        levels: {
          pratico:
            'Recomende o modelo (tradicional, agil ou hibrido) pela complexidade, mudanca e maturidade, justificando.',
          intermediario:
            'Justifique o modelo confrontando alternativas e o trade-off entre previsibilidade e adaptabilidade.',
          academico:
            'Fundamente no PMBOK, no Cynefin (Snowden) e em contingency theory de gestao de projetos.',
        },
      },
      {
        domain: 'Stakeholders e Comunicacao',
        text: 'Exija que a LLM verifique se o plano de comunicacao do projeto contempla todos os stakeholders mapeados (poder/interesse), se o Termo de Abertura (Project Charter) esta atualizado e se a gestao de aquisicoes segue criterios formais de avaliacao.',
        levels: {
          pratico:
            'Verifique o plano de comunicacao por stakeholder (poder/interesse), o Project Charter e a gestao de aquisicoes.',
          intermediario:
            'Justifique a estrategia por quadrante de stakeholders e o trade-off entre transparencia e ruido.',
          academico:
            'Fundamente em stakeholder management (matriz poder/interesse) e em comunicacao de projetos (PMBOK).',
        },
      },
    ],
  },
];

// Converte um nome de dominio em um slug estavel para compor a chave do dominio.
function slug(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Niveis de profundidade. `instruction` abre o bloco; `suffix` fecha-o com uma
// diretiva aplicada a CADA dominio listado. Quando um dominio declara `levels`,
// seu texto sob medida substitui o `text` base (ver dominio SOLID como exemplo);
// caso contrario, usa-se o `text` base + o `suffix` do nivel — assim os tres
// niveis produzem saidas visivelmente distintas para todos os ~80 dominios.
export const LEVELS = {
  pratico: {
    label: 'Pratico',
    instruction: 'Aplique de forma objetiva, priorizando acionabilidade imediata.',
    suffix:
      'Para cada item acima, entregue um checklist objetivo e os diffs/trechos prontos para aplicar.',
  },
  intermediario: {
    label: 'Intermediario',
    instruction: 'Equilibre pratica e fundamentacao em cada ponto avaliado.',
    suffix:
      'Para cada item acima, justifique tecnicamente a recomendacao e aponte os trade-offs envolvidos.',
  },
  academico: {
    label: 'Academico',
    instruction: 'Aprofunde a fundamentacao conceitual de cada ponto.',
    suffix:
      'Para cada item acima, fundamente com os conceitos do tema e cite o framework ou autor de referencia.',
  },
};

// ─── Registro derivado: knowledgeDomains (chave unica por dominio) ───
// Chave = `${ebookId}/${slug(domain)}`, garantindo unicidade mesmo quando o
// mesmo nome de dominio (ex. "Observabilidade") aparece em ebooks diferentes.
export const knowledgeDomains = {};
// themes: agrupamento tema(ebook) → lista de chaves de dominio.
export const themes = {};

for (const ebook of EBOOKS) {
  const domainKeys = [];
  for (const insight of ebook.insights) {
    const key = `${ebook.id}/${slug(insight.domain)}`;
    knowledgeDomains[key] = {
      label: insight.domain,
      ebookId: ebook.id,
      ebookTitle: ebook.title,
      rule: insight.text,
      levels: insight.levels || null, // override sob medida por nivel (opcional)
    };
    domainKeys.push(key);
  }
  themes[ebook.id] = { title: ebook.title, prompts: ebook.prompts, domains: domainKeys };
}

// Retorna as chaves de dominio relevantes para um template, casando pelo NOME de
// exibicao do template (mesmo valor usado no campo `prompts:[...]` dos ebooks).
// Aceita tambem o proprio nome cru; preserva a ordem dos ebooks e nao duplica.
export function domainsForTemplate(templateName) {
  if (!templateName) return [];
  const out = [];
  for (const ebook of EBOOKS) {
    if (ebook.prompts.includes(templateName)) {
      for (const insight of ebook.insights) {
        out.push(`${ebook.id}/${slug(insight.domain)}`);
      }
    }
  }
  return out;
}

// Camada ADITIVA opt-in: recebe um prompt ja montado e devolve-o enriquecido com
// um bloco "BASE DE CONHECIMENTO" das regras dos dominios marcados e, opcional,
// um contexto livre. No-op seguro: sem dominios e sem contexto, retorna o prompt
// inalterado (preserva a saida byte-a-byte dos geradores quando nao usado).
export function appendKnowledge(prompt, { domains = [], level = 'pratico', extra = '' } = {}) {
  const base = prompt == null ? '' : String(prompt);
  const selected = (domains || []).filter((k) => knowledgeDomains[k]);
  const extraText = (extra || '').trim();
  if (selected.length === 0 && !extraText) return base;

  const levelKey = LEVELS[level] ? level : 'pratico';
  const lvl = LEVELS[levelKey];
  let block = base;
  if (selected.length > 0) {
    block += `\n\nBASE DE CONHECIMENTO (ebooks):\n`;
    block += `Nivel: ${lvl.label} — ${lvl.instruction}\n`;
    selected.forEach((key, i) => {
      const d = knowledgeDomains[key];
      // Texto sob medida do nivel quando o dominio o declara; senao, o texto base.
      const text = (d.levels && d.levels[levelKey]) || d.rule;
      block += `${i + 1}. [${d.ebookTitle}] ${d.label}: ${text}\n`;
    });
    block += `${lvl.suffix}\n`;
  }
  if (extraText) {
    block += `\nCONTEXTO ADICIONAL:\n${extraText}\n`;
  }
  return block;
}

// ─── #KB Fase 5: detecção de termos para o chat ───
// Mapeia termos técnicos (gatilhos) → chave do domínio mais relevante. Usado por
// chat.js para sugerir, sob demanda, enriquecer a conversa com a regra do ebook
// quando o usuário menciona um conceito. Termos de uma palavra casam por token
// (evita falsos positivos como "api" dentro de "rapido"); termos com espaço/barra
// casam por substring. Chaves inválidas são filtradas em runtime.
export const TRIGGERS = {
  solid: 'e-algo/solid',
  'design pattern': 'e-algo/design-patterns',
  'padroes de projeto': 'e-algo/design-patterns',
  'big-o': 'e-algo/complexidade-big-o',
  complexidade: 'e-algo/complexidade-big-o',
  'clean code': 'e-algo/clean-code-12-factor',
  '12-factor': 'e-algo/clean-code-12-factor',
  owasp: 'e-qual/analise-estatica-e-sast',
  sast: 'e-qual/analise-estatica-e-sast',
  tdd: 'e-qual/tdd-bdd',
  bdd: 'e-qual/tdd-bdd',
  observabilidade: 'e-devops/observabilidade',
  'ci/cd': 'e-devops/ci-cd-pipeline',
  cicd: 'e-devops/ci-cd-pipeline',
  pipeline: 'e-devops/ci-cd-pipeline',
  microservico: 'e-devops/microservicos',
  microsservico: 'e-devops/microservicos',
  lgpd: 'e-priv/bases-legais-lgpd',
  gdpr: 'e-priv/bases-legais-lgpd',
  privacidade: 'e-priv/7-principios-pbd',
  privacy: 'e-priv/7-principios-pbd',
  bpmn: 'e-proc/modelagem-bpmn',
  dmn: 'e-proc/dmn-decision-tables',
  api: 'e-api/api-design-principles',
  rest: 'e-api/api-design-principles',
  c4: 'e-arch/documentacao-c4-4-1',
  arquitetura: 'e-arch/atributos-de-qualidade-ilities',
  usabilidade: 'e-ux/usabilidade-heuristica',
  nielsen: 'e-ux/usabilidade-heuristica',
  ux: 'e-ux/usabilidade-heuristica',
  cloud: 'e-cloud/seguranca-na-nuvem',
  nuvem: 'e-cloud/seguranca-na-nuvem',
  iam: 'e-cloud/seguranca-na-nuvem',
  overfitting: 'e-ia/overfitting-e-generalizacao',
  vies: 'e-ia/vies-e-etica',
  bias: 'e-ia/vies-e-etica',
  okr: 'e-squads/okr-e-resultados',
  wsjf: 'e-agile/valor-e-priorizacao',
  scrum: 'e-agile/artefatos-ageis',
  sprint: 'e-agile/artefatos-ageis',
  throughput: 'e-metricas/fluxo-e-entrega-little',
  wip: 'e-metricas/fluxo-e-entrega-little',
  'lead time': 'e-metricas/fluxo-e-entrega-little',
  'monte carlo': 'e-metricas/previsibilidade-monte-carlo',
  'big data': 'e-dados/big-data-5-vs',
  etl: 'e-dados/qualidade-dos-dados-etl',
  invest: 'e-requisitos/historias-de-usuario',
  moscow: 'e-requisitos/gestao-do-backlog',
  pmbok: 'e-gestao/modelo-de-gestao-pmbok',
  eap: 'e-gestao/escopo-e-eap',
  kotter: 'e-lideranca/gestao-de-mudancas-kotter',
};

function norm(s) {
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Detecta termos técnicos no texto e devolve as chaves de domínio relevantes
// (únicas, sem duplicar, filtradas às que existem no registro). Função pura.
export function matchDomains(text) {
  if (!text) return [];
  const n = norm(text);
  const tokens = new Set(n.split(/[^a-z0-9]+/).filter(Boolean));
  const out = [];
  const seen = new Set();
  for (const [term, key] of Object.entries(TRIGGERS)) {
    if (!knowledgeDomains[key]) continue;
    const t = norm(term);
    const isPhrase = /[^a-z0-9]/.test(t);
    const hit = isPhrase ? n.includes(t) : tokens.has(t);
    if (hit && !seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
  }
  return out;
}
