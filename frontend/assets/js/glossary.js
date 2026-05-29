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
