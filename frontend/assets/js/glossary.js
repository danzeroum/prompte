// glossary.js — glossário inline para o jargão de domínio (#M-UX6).
// A auditoria apontou siglas (WSJF, INVEST, Tuckman, 5 Vs, EAP, PMBOK…) sem
// explicação contextual. Aqui decoramos a primeira ocorrência de cada termo nas
// descrições dos templates (.template-description, texto puro e seguro) com um
// botão acessível que abre/fecha uma definição curta — ajuda sem sair da página.

export const glossary = {
  WSJF: 'Weighted Shortest Job First — prioriza pelo custo do atraso dividido pelo tamanho do trabalho.',
  INVEST:
    'Critério para boas histórias de usuário: Independent, Negotiable, Valuable, Estimable, Small, Testable.',
  Tuckman: 'Modelo de evolução de times: Forming, Storming, Norming, Performing.',
  '5 Vs': 'As cinco dimensões do Big Data: Volume, Velocidade, Variedade, Veracidade e Valor.',
  EAP: 'Estrutura Analítica do Projeto — decomposição hierárquica do escopo em entregas.',
  PMBOK: 'Guia de boas práticas em gestão de projetos publicado pelo PMI.',
  'Monte Carlo': 'Simulação que estima prazos/probabilidades a partir da variabilidade histórica.',
  BDD: 'Behavior-Driven Development — especifica o comportamento no formato Given-When-Then.',
  XAI: 'Explainable AI — técnicas para tornar interpretáveis as decisões de modelos.',
  'Lead Time': 'Tempo entre o pedido e a entrega de um item de trabalho.',
  DoD: 'Definition of Done — critérios que tornam um item realmente concluído.',
  ETL: 'Extract, Transform, Load — extração, transformação e carga de dados.',
  SMART: 'Ciclo/critério: específico, mensurável, atingível, relevante e temporal.',
  OKR: 'Objectives and Key Results — objetivos com resultados-chave mensuráveis.',
  Scrum: 'Framework ágil com papéis, eventos e artefatos para entregas iterativas.',
  // ─── #KB: termos técnicos que aparecem nas regras dos ebooks (base de conhecimento) ───
  SOLID:
    'Cinco princípios de design OO: Single Responsibility, Open/Closed, Liskov, Interface Segregation e Dependency Inversion.',
  OWASP:
    'Open Worldwide Application Security Project — referência de boas práticas e listas de vulnerabilidades (ex.: OWASP Top 10).',
  DORA: 'DevOps Research and Assessment — métricas de desempenho de entrega (deploy frequency, lead time, MTTR, change fail rate).',
  BPMN: 'Business Process Model and Notation — notação gráfica padrão para modelar processos de negócio.',
  DMN: 'Decision Model and Notation — modela regras de decisão (tabelas de decisão) separadas do código.',
  SAST: 'Static Application Security Testing — análise estática de código em busca de vulnerabilidades.',
  SAMM: 'Software Assurance Maturity Model (OpenSAMM) — modelo de maturidade de segurança em 5 dimensões.',
  C4: 'Modelo de documentação de arquitetura em 4 níveis: Contexto, Container, Componente e Código.',
  WIP: 'Work in Progress — quantidade de itens em andamento; limitá-lo melhora o fluxo de entrega.',
  Throughput: 'Quantidade de itens de trabalho entregues por período (vazão).',
  MoSCoW: 'Técnica de priorização: Must, Should, Could e Won’t have.',
  '12-Factor':
    'Metodologia para apps SaaS portáveis e resilientes (configuração no ambiente, logs como eventos, etc.).',
  Kotter: 'Modelo de gestão de mudanças em 8 etapas, de John Kotter.',
  'Big-O':
    'Notação que descreve o crescimento do custo (tempo/espaço) de um algoritmo em função da entrada.',
  IAM: 'Identity and Access Management — gestão de identidades e controle de acesso a recursos.',
  'Privacy by Design':
    'Abordagem que incorpora a privacidade desde a concepção do sistema (7 princípios).',
  Nielsen: 'Conjunto de 10 heurísticas de usabilidade de Jakob Nielsen para avaliar interfaces.',
  TDD: 'Test-Driven Development — escreve-se o teste antes do código de produção.',
  'Cost of Delay': 'Custo de adiar uma entrega; base do WSJF para priorização por valor.',
};

function decorate(node, term) {
  const text = node.nodeValue;
  const i = text.toLowerCase().indexOf(term.toLowerCase());
  if (i < 0) return false;
  const matched = text.slice(i, i + term.length);
  const frag = document.createDocumentFragment();
  if (text.slice(0, i)) frag.appendChild(document.createTextNode(text.slice(0, i)));

  const wrap = document.createElement('span');
  wrap.className = 'pe-gloss-wrap';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'pe-gloss';
  btn.textContent = matched;
  btn.setAttribute('aria-label', 'Definição de ' + matched);
  btn.setAttribute('aria-expanded', 'false');
  const mark = document.createElement('span');
  mark.className = 'pe-gloss-mark';
  mark.setAttribute('aria-hidden', 'true');
  mark.textContent = 'ⓘ';
  btn.appendChild(mark);

  const pop = document.createElement('span');
  pop.className = 'pe-gloss-pop';
  pop.setAttribute('role', 'tooltip');
  pop.hidden = true;
  pop.textContent = glossary[term];

  btn.addEventListener('click', () => {
    const willOpen = pop.hidden;
    pop.hidden = !willOpen;
    btn.setAttribute('aria-expanded', String(willOpen));
  });

  wrap.append(btn, pop);
  frag.appendChild(wrap);
  if (text.slice(i + term.length))
    frag.appendChild(document.createTextNode(text.slice(i + term.length)));
  node.parentNode.replaceChild(frag, node);
  return true;
}

function firstTextNodeWith(el, term) {
  const q = term.toLowerCase();
  for (const node of el.childNodes) {
    if (node.nodeType === 3) {
      if (node.nodeValue.toLowerCase().includes(q)) return node;
    } else if (node.nodeType === 1 && !node.classList.contains('pe-gloss-wrap')) {
      const found = firstTextNodeWith(node, term);
      if (found) return found;
    }
  }
  return null;
}

// Decora a primeira ocorrência (global) de cada termo nas descrições. Retorna
// quantos termos foram decorados — usado pelos testes.
export function initGlossary(root = document) {
  const targets = Array.from(root.querySelectorAll('.template-description'));
  if (!targets.length) return 0;
  let count = 0;
  for (const term of Object.keys(glossary).sort((a, b) => b.length - a.length)) {
    for (const el of targets) {
      const node = firstTextNodeWith(el, term);
      if (node) {
        if (decorate(node, term)) count++;
        break;
      }
    }
  }
  return count;
}

// Re-decora ao trocar de idioma: applyI18n() reescreve o textContent das
// descrições (removendo os wrappers), então basta rodar de novo (#M-UX6).
// O listener é anexado uma única vez.
let _i18nBound = false;
export function bindGlossaryToI18n(root = document) {
  if (_i18nBound || typeof document === 'undefined') return;
  _i18nBound = true;
  document.addEventListener('pe:i18n', () => initGlossary(root));
}
