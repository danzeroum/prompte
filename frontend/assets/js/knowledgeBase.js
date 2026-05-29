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
      },
      {
        domain: 'CI/CD Pipeline',
        text: 'Quando revisar codigo de deploy, referencie as etapas do pipeline (build, test, stage, deploy). Peça validacao em cada estagio e rollback automatizado.',
      },
      {
        domain: 'Seguranca no Codigo',
        text: 'Exija que o codigo siga o SAMM (OpenSAMM) nas 5 dimensoes: Governanca, Design, Implementacao, Verificacao e Operacao.',
      },
      {
        domain: 'Microservicos',
        text: 'Para arquiteturas de microservicos, exija mapeamento de dependencias, interface contracts e strategy patterns para desacoplamento.',
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
      },
      {
        domain: 'Data-Driven',
        text: 'Exija que a LLM justifique decisoes com dados, metricas ou evidencias. Solicite KPIs, dashboards e hipoteses mensuraveis.',
      },
      {
        domain: 'Cultura de Inovacao',
        text: 'Para requests de novos projetos, peça a LLM considerar elementos de cultura organizacional, modelos de maturidade digital e learning plans ao inves de business plans.',
      },
      {
        domain: 'Ecossistema',
        text: 'Para analises de repositorio, inclua perspectivas de ecossistema: como o codigo interage com parceiros, fornecedores e outros servicos.',
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
      },
      {
        domain: 'Design Centrado no Usuario',
        text: 'Solicite que a LLM considere o processo completo de design: empatizar, definir, idear, prototipar e testar — nao apenas o codigo.',
      },
      {
        domain: 'Prototipacao Rapida',
        text: 'Sempre inclua no prompt a solicitacao de prototipos como ferramenta de co-criacao, nao apenas validacao. Peça Crazy 8s ou prototipos de baixa fidelidade.',
      },
      {
        domain: 'Arquitetura de Informacao',
        text: 'Para revisar interfaces, solicite avaliacao da arquitetura de informacao: organizacao, navegacao, rotulacao e hierarquia dos conteudos.',
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
      },
      {
        domain: 'Anti-Patterns de API',
        text: 'Sempre inclua verificacao de anti-patterns: falta de versionamento, documentacao ausente, sem rate limiting, logs nao registrados e endpoints nao documentados.',
      },
      {
        domain: 'Observabilidade (Logs/Metricas/Traces)',
        text: 'Solicite que o prompt inclua requisitos de observabilidade: logs estruturados com contexto, metricas de desempenho e tracing de requisicoes.',
      },
      {
        domain: 'Plugin Architecture',
        text: 'Para sistemas extensiveis, solicite avaliacao de: ponto de entrada, interfaces de comunicacao (hooks/APIs), gerenciamento de ciclo de vida e compatibilidade.',
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
      },
      {
        domain: 'Leis da Arquitetura',
        text: 'Sempre inclua: "Toda decisao tem seu preco" e "Uma decisao so pode ser avaliada em relacao ao seu contexto". Peça trade-offs explicitos.',
      },
      {
        domain: 'Documentacao C4/4+1',
        text: 'Para qualquer analise, solicite documentacao nos niveis C4: Contexto, Container, Componente e Codigo. Para revisoes, inclua diagramas de sequencia (Cenarios).',
      },
      {
        domain: 'Refatoracao',
        text: 'Solicite analise de oportunidades de refatoracao com: reducao de acoplamento, automacao de testes, identificacao de padroes emergentes e planejamento escalavel.',
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
      },
      {
        domain: 'Inferencia e Teste de Hipotese',
        text: 'Para recomendacoes, solicite que a LLM formule hipoteses testaveis com nivel de significancia definido (alpha), considerando erros tipo I e II.',
      },
      {
        domain: 'Regressao Linear',
        text: 'Para analises correlacionais, solicite modelos de regressao com metricas de qualidade (R2 ajustado), teste F para significancia geral e teste t para parametros individuais.',
      },
      {
        domain: 'Amostragem',
        text: 'Solicite definicao de plano de amostragem: objetivo, populacao-alvo, metodo (aleatoria simples, estratificada, sistematica) e tamanho adequado.',
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
      },
      {
        domain: 'Bases Legais LGPD',
        text: 'Sempre que envolver dados, solicite que a LLM identifique a base legal aplicavel (consentimento, obrigacao legal, interesse legitimo, etc.) e documente a justificativa.',
      },
      {
        domain: 'Dados Pessoais vs Sensiveis',
        text: 'Solicite classificacao adequada: dados pessoais vs. dados sensiveis. Para sensiveis, exija protecao adicional e justificativa de processamento.',
      },
      {
        domain: 'Incidentes de Seguranca',
        text: 'Para qualquer alteracao, solicite analise de cenarios de incidente, plano de resposta e cadeia de evidencias para auditoria.',
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
      },
      {
        domain: 'Niveis de Teste',
        text: 'Exija cobertura em todos os niveis: unidade, integracao, sistema e aceitacao. Para cada nivel, peça foco em limites, riscos e areas de maior complexidade.',
      },
      {
        domain: 'TDD/BDD',
        text: 'Para codigo novo, solicite que a LLM gere ou valide usando TDD (Test-Driven Development) ou BDD (Behavior-Driven Development) com Given/When/Then.',
      },
      {
        domain: 'Analise Estatica e SAST',
        text: 'Solicite analise estatica automatizada para detectar: codigo morto, duplicado, complexidade ciclomatica alta, vulnerabilidades OWASP e violacoes de padroes de codificacao.',
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
      },
      {
        domain: 'Design Patterns',
        text: 'Identifique padroes aplicaveis: criacionais (Factory, Singleton, Builder), estruturais (Adapter, Decorator, Facade) e comportamentais (Strategy, Observer, Template Method).',
      },
      {
        domain: 'Complexidade Big-O',
        text: 'Sempre que envolver performance, solicite analise de complexidade temporal (Big-O) e compare estruturas de dados para o caso de uso especifico.',
      },
      {
        domain: 'Clean Code + 12-Factor',
        text: 'Solicite aderencia a clean code (nomes descritivos, funcoes curtas, sem duplicacao) e aos 12 fatores app (base de codigo rastreavel, configuracoes no ambiente, logs como eventos).',
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
      },
      {
        domain: 'DMN (Decision Tables)',
        text: 'Para logica de negocio, solicite que decisoes complexas sejam modeladas em DMN (Decision Model and Notation) separando regras de negocio do codigo.',
      },
      {
        domain: 'Process Mining',
        text: 'Solicite que a LLM sugira uso de process mining nos logs existentes para descobrir o "processo real" vs o "processo documentado" antes de propor mudancas.',
      },
      {
        domain: 'Orquestracao BPMS',
        text: 'Para automacao, solicite design de orquestracao com: chamadas sincronas e assincronas (digital workers), acoplamento fraco via REST API e tolerancia a falhas.',
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
      },
      {
        domain: 'Modelos de Servico',
        text: 'Quando revisar codigo hospedado em nuvem, exija que a LLM identifique qual modelo de servico (SaaS, PaaS, IaaS ou FaaS) esta sendo utilizado e se os recursos estao provisionados de forma otimizada (Pay as you Go).',
      },
      {
        domain: 'Migracao e Adocao',
        text: 'Inclua verificacao dos 6 pilares de preparacao para migracao em nuvem (negocios, pessoas, governanca, plataforma, seguranca, operacoes) e solicite a LLM que avalie se o codigo esta pronto para ambientes cloud-native.',
      },
      {
        domain: 'Compliance e Regulacao',
        text: 'Exija que a LLM verifique se o codigo atende aos requisitos de conformidade aplicaveis (LGPD, resolucao BACEN 4.658, NIST CSF) e se implementa praticas de seguranca by design, como criptografia em escala e resiliencia global.',
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
      },
      {
        domain: 'Requisitos Nao Funcionais',
        text: 'Quando revisar codigo, inclua verificacao explicita de requisitos nao funcionais (performance, seguranca, usabilidade, escalabilidade) e solicite a LLM que identifique gaps entre o implementado e os SLAs definidos.',
      },
      {
        domain: 'Gestao do Backlog',
        text: 'Exija que a LLM analise se a estrutura do projeto reflete um backlog de produto bem refinado, com itens ordenados por prioridade (metodo MoSCoW) e com nivel de detalhamento adequado para a sprint atual.',
      },
      {
        domain: 'Prototipagem e Validacao',
        text: 'Ao revisar funcionalidades novas, solicite que a LLM verifique se existem prototipos ou especificacoes claras que validem os requisitos antes da implementacao, e se o codigo corresponde fielmente as especificacoes documentadas.',
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
      },
      {
        domain: 'Artefatos Ageis',
        text: 'Quando revisar, exija que a LLM verifique a existencia e qualidade dos artefatos ageis: Scrum Board atualizado, Grafico Burndown, Product Backlog priorizado com criterios de aceite claros e Definition of Done bem estabelecida.',
      },
      {
        domain: 'Metricas de Fluxo',
        text: 'Inclua em seus prompts uma avaliacao do fluxo de entrega: Lead Time, tempo de ciclo e throughput. Solicite a LLM que identifique gargalos no processo de desenvolvimento baseado nos padroes de commit e entrega.',
      },
      {
        domain: 'Valor e Priorizacao',
        text: 'Exija que a LLM analise se as funcionalidades implementadas seguem a priorizacao por valor (WSJF - Weighted Shortest Job First) e se o Cost of Delay foi considerado nas decisoes de roadmap e sequenciamento de sprints.',
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
      },
      {
        domain: 'Estrutura de Equipe',
        text: 'Quando revisar codigo em contexto de squads, exija que a LLM avalie se a estrutura do codigo reflete uma equipe multifuncional (5-10 membros) com autonomia e se as responsabilidades estao bem distribuidas sem dependencias externas criticas.',
      },
      {
        domain: 'Competencias e Perfil',
        text: 'Inclua verificacao sobre se o codigo demanda competencias presentes no perfil do squad, solicitando a LLM que identifique skills faltantes (competencias tecnicas, comunicacao, tomada de decisao) que possam impactar a entrega.',
      },
      {
        domain: 'Dinamica de Equipe (Tuckman)',
        text: 'Exija que a LLM analise padroes de colaboracao no codigo (comunicacoes, code reviews, pair programming) e indique se o time esta em fase de Forming, Storming, Norming ou Performing (modelo de Tuckman), sugerindo acoes de melhoria.',
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
      },
      {
        domain: 'Cultura Organizacional',
        text: 'Quando revisar processos e padroes de codigo, exija que a LLM identifique se os elementos visiveis da cultura (politicas, procedimentos, estrutura) e os invisiveis (valores, crencas, pressupostos) estao alinhados com as praticas de desenvolvimento.',
      },
      {
        domain: 'Mobilizacao e Engajamento',
        text: 'Inclua avaliacao dos 5 fatores de mobilizacao: conceito de comunidade, comunicacao, sentimento de importancia, escolha criteriosa dos participantes e reconhecimento. Solicite que a LLM indique se o ambiente promove alto desempenho.',
      },
      {
        domain: 'Lideranca Positiva',
        text: 'Exija que a LLM analise se as decisoes tecnicas e de arquitetura refletem lideranca positiva (foco em forcas ao inves de fraquezas, otimismo, apoio ao inves de critica) e se promovem um ambiente de eliminacao do medo e busca do virtuosismo.',
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
      },
      {
        domain: 'Qualidade dos Dados (IA)',
        text: 'Quando revisar codigo de IA/ML, exija que a LLM verifique a qualidade dos dados (completude, consistencia, veracidade), aplicando o principio "garbage in, trash out", e se a LGPD/GDPR esta sendo respeitada no tratamento de dados sensiveis.',
      },
      {
        domain: 'Overfitting e Generalizacao',
        text: 'Inclua verificacao de overfitting e underfitting nos modelos: solicite que a LLM analise se ha separacao adequada entre treino e teste, se a metrica de avaliacao e condizente com o problema de negocio e se o modelo generaliza para dados reais.',
      },
      {
        domain: 'Seguranca de IA',
        text: 'Exija que a LLM avalie a robustez do modelo contra ataques adversarios (pequenas alteracoes nos dados de entrada), se ha integracao de supervisao humana em aplicacoes criticas, e se os principios de IA responsavel (transparencia, justica, privacidade, responsabilidade) sao seguidos.',
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
      },
      {
        domain: 'Qualidade dos Dados (ETL)',
        text: 'Quando revisar pipelines de dados, exija que a LLM verifique o processo de ETL completo: tratamento de dados faltantes, remocao de anomalias/outliers, normalizacao, e se a integracao de multiplas fontes mantem a consistencia e a rastreabilidade.',
      },
      {
        domain: 'Arquitetura de Microsservicos',
        text: 'Inclua avaliacao dos principios de design de microsservicos: dominio bem definido, baixo acoplamento entre servicos, independencia de deploy, e se a arquitetura suporta escalabilidade horizontal e resiliencia.',
      },
      {
        domain: 'Analise e Decisao (SMART)',
        text: 'Exija que a LLM verifique se o processo analitico segue o ciclo completo (definicao do problema, coleta, preparacao, modelagem, comunicacao de resultados, feedback) e se as metricas estao definidas segundo o modelo SMART.',
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
      },
      {
        domain: 'DevOps e Automacao',
        text: 'Quando revisar infraestrutura e deploy, exija que a LLM verifique a presenca de praticas CI/CD, automacao de testes, containers e se a cultura de iteracao continua esta refletida na pipeline de entrega do software.',
      },
      {
        domain: 'Observabilidade (Arq.)',
        text: 'Inclua verificacao de observabilidade: solicite que a LLM analise se existem mecanismos de logging, tracing e monitoramento que permitam compreender o comportamento interno do sistema e identificar gargalos de performance.',
      },
      {
        domain: 'Seguranca por Design',
        text: 'Exija que a LLM avalie se a seguranca esta integrada desde as fases iniciais do projeto (Security by Design), verificando criptografia de dados sensiveis, controles de acesso baseados em privilegios minimos e conformidade com LGPD e GDPR.',
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
      },
      {
        domain: 'Fluxo e Entrega (Little)',
        text: 'Quando revisar projetos, exija que a LLM analise metricas de fluxo como Lead Time (tempo desde a solicitacao ate a entrega), Throughput (itens entregues por periodo) e Work in Progress, identificando gargalos e sugerindo limites de WIP.',
      },
      {
        domain: 'Efficiency vs Effectiveness',
        text: 'Inclua avaliacao da diferenca entre eficiencia (fazer as coisas certo) e eficacia (fazer as coisas certas): solicite que a LLM verifique se as metricas do projeto medem impacto real no negocio, nao apenas produtividade ou volume de entregas.',
      },
      {
        domain: 'Previsibilidade (Monte Carlo)',
        text: 'Exija que a LLM analise a previsibilidade do projeto usando dados historicos de ciclo de entrega e simulacoes de Monte Carlo, verificando se as estimativas de prazo sao realistas e se ha margem de erro adequada.',
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
      },
      {
        domain: 'Gerenciamento de Riscos',
        text: 'Quando revisar projetos, exija que a LLM identifique riscos tecnicos e de negocio (com probabilidade e impacto), e se as respostas aos riscos (evitar, transferir, mitigar, aceitar) estao documentadas e sendo monitoradas ativamente.',
      },
      {
        domain: 'Modelo de Gestao (PMBOK)',
        text: 'Inclua avaliacao de qual modelo de gestao e mais adequado (tradicional, agil ou hibrido): solicite que a LLM analise a complexidade do projeto, o nivel de mudanca nos requisitos e a maturidade da organizacao para recomendar o modelo ideal.',
      },
      {
        domain: 'Stakeholders e Comunicacao',
        text: 'Exija que a LLM verifique se o plano de comunicacao do projeto contempla todos os stakeholders mapeados (poder/interesse), se o Termo de Abertura (Project Charter) esta atualizado e se a gestao de aquisicoes segue criterios formais de avaliacao.',
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

// Niveis de profundidade: nao reescrevem o texto de cada dominio (a fonte tem um
// unico texto por insight), apenas ajustam a instrucao de como aplica-los.
export const LEVELS = {
  pratico: {
    label: 'Pratico',
    instruction: 'Aplique de forma objetiva: checklist acionavel + diffs prontos.',
  },
  intermediario: {
    label: 'Intermediario',
    instruction: 'Aplique com justificativa tecnica para cada ponto avaliado.',
  },
  academico: {
    label: 'Academico',
    instruction: 'Aplique com fundamentacao conceitual e referencias dos frameworks citados.',
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

  const lvl = LEVELS[level] || LEVELS.pratico;
  let block = base;
  if (selected.length > 0) {
    block += `\n\nBASE DE CONHECIMENTO (ebooks):\n`;
    block += `Nivel: ${lvl.label} — ${lvl.instruction}\n`;
    selected.forEach((key, i) => {
      const d = knowledgeDomains[key];
      block += `${i + 1}. [${d.ebookTitle}] ${d.label}: ${d.rule}\n`;
    });
  }
  if (extraText) {
    block += `\nCONTEXTO ADICIONAL:\n${extraText}\n`;
  }
  return block;
}
