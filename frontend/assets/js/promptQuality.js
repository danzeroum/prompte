// promptQuality.js — Assistente de Qualidade ("ESLint para prompts").
// Portado de design-reference/assets/assistant.jsx com a correção de
// casamento por *id* dos campos (não por label, que não existe nos metadados
// de generators.js). Módulo puro: entrada → saída, sem efeitos colaterais.

import { t } from './i18n.js';

const VAGUE_TERMS = [
  'melhor',
  'bom',
  'boa',
  'rápido',
  'rapido',
  'eficiente',
  'otimizado',
  'moderno',
  'robusto',
  'escalável',
  'escalavel',
  'limpo',
  'simples',
  'adequado',
  'legal',
];

// Padrões de id que sinalizam campos de contexto e entrada concreta.
// Baseia-se nos ids estáveis dos templates: rc-contexto, db-codigo, ag-caminho…
const CTX_ID_RE = /-(contexto|requisito|funcionalidade|perfil|objetivo|gargalo)/i;
const INPUT_ID_RE = /-(codigo|arquivo|repo|comp|erro|escopo|dir|caminho|trecho|diff)/i;

/**
 * analyzePrompt(template, formData, builtText)
 *
 * @param {object} template  - entrada de generatorTemplates; precisa de .fields [{id,type}]
 * @param {object} formData  - { [fieldId]: value } coletado via collectFormData()
 * @param {string} builtText - saída de buildPrompt(key, formData)
 * @returns {{ score, grade, checks, empty, topTip, issues }}
 */
export function analyzePrompt(template, formData, builtText) {
  const text = builtText || '';
  const empty = !text.trim();
  const fields = template && Array.isArray(template.fields) ? template.fields : [];

  const textFields = fields.filter((f) => f.type !== 'checkbox');
  const checkboxes = fields.filter((f) => f.type === 'checkbox');
  const filled = textFields.map((f) => ({ f, v: String(formData[f.id] || '').trim() }));
  const allInputs = filled.map((x) => x.v).join('\n');
  const checkedCount = checkboxes.filter((f) => formData[f.id]).length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const checks = [];

  // 1. Objetivo e papel — verbo de tarefa explícito (templates sempre fornecem)
  checks.push({
    id: 'goal',
    label: t('q.goal.label'),
    ref: t('q.goal.ref'),
    status: !empty ? 'pass' : 'fail',
    tip: !empty ? t('q.goal.pass') : t('q.goal.fail'),
  });

  // 2. Contexto suficiente — casamento por id do campo (CORREÇÃO 1)
  const ctxFields = filled.filter((x) => CTX_ID_RE.test(x.f.id));
  const ctxChars = ctxFields.reduce((s, x) => s + x.v.length, 0);
  const ctxStatus =
    ctxFields.length === 0 ? 'pass' : ctxChars >= 60 ? 'pass' : ctxChars >= 15 ? 'warn' : 'fail';
  checks.push({
    id: 'context',
    label: t('q.context.label'),
    ref: t('q.context.ref'),
    status: ctxStatus,
    tip: ctxStatus === 'pass' ? t('q.context.pass') : t(`q.context.${ctxStatus}`),
  });

  // 3. Entrada concreta — casamento por id do campo (CORREÇÃO 1)
  const inFields = filled.filter((x) => INPUT_ID_RE.test(x.f.id));
  const hasInput = inFields.some((x) => x.v.length > 0);
  const inputStatus = inFields.length === 0 ? 'pass' : hasInput ? 'pass' : 'fail';
  checks.push({
    id: 'input',
    label: t('q.input.label'),
    ref: t('q.input.ref'),
    status: inputStatus,
    tip: inputStatus === 'pass' ? t('q.input.pass') : t('q.input.fail'),
  });

  // 4. Formato de saída especificado
  const hasFormat =
    /(formato de resposta|entregue|entregar|fa[çc]a:|fazer:|formato|entregue:)/i.test(text) ||
    /\n\s*\d+\./.test(text);
  const formatStatus = empty ? 'fail' : hasFormat ? 'pass' : 'warn';
  checks.push({
    id: 'format',
    label: t('q.format.label'),
    ref: t('q.format.ref'),
    status: formatStatus,
    tip: formatStatus === 'pass' ? t('q.format.pass') : t('q.format.warn'),
  });

  // 5. Restrições & critérios
  const hasConstraints =
    checkedCount > 0 ||
    /(restri|regras|obrigat|n[ãa]o sacrific|sla|crit[ée]rio|severidade|priorize|priorizar|mantenha|mantendo|evite|compatib)/i.test(
      text,
    );
  const constraintsStatus = empty ? 'fail' : hasConstraints ? 'pass' : 'warn';
  checks.push({
    id: 'constraints',
    label: t('q.constraints.label'),
    ref: t('q.constraints.ref'),
    status: constraintsStatus,
    tip: constraintsStatus === 'pass' ? t('q.constraints.pass') : t('q.constraints.warn'),
  });

  // 6. Anti-ambiguidade — termos vagos nos campos do usuário
  const vagueRe = new RegExp(`\\b(${VAGUE_TERMS.join('|')})\\b`, 'gi');
  const found = [
    ...new Set((allInputs.toLowerCase().match(vagueRe) || []).map((v) => v.toLowerCase())),
  ];
  checks.push({
    id: 'specific',
    label: t('q.specific.label'),
    ref: t('q.specific.ref'),
    status: found.length === 0 ? 'pass' : 'warn',
    tip:
      found.length === 0
        ? t('q.specific.pass')
        : t('q.specific.warn').replace('{terms}', found.slice(0, 3).join('", "')),
  });

  // 7. Detalhamento adequado — nº de palavras do texto gerado
  const depthStatus = words >= 80 ? 'pass' : words >= 35 ? 'warn' : 'fail';
  checks.push({
    id: 'depth',
    label: t('q.depth.label'),
    ref: t('q.depth.ref'),
    status: depthStatus,
    tip: depthStatus === 'pass' ? t('q.depth.pass') : t(`q.depth.${depthStatus}`),
  });

  // Score: pass=1, warn=0.5, fail=0
  const W = { pass: 1, warn: 0.5, fail: 0 };
  const score = empty
    ? 0
    : Math.round((100 * checks.reduce((s, c) => s + W[c.status], 0)) / checks.length);
  const grade = empty ? '—' : score >= 80 ? 'Forte' : score >= 55 ? 'Bom' : 'Fraco';

  // topTip = primeiro não-pass (fails antes de warns)
  const notPass = checks.filter((c) => c.status !== 'pass');
  notPass.sort((a, b) => (a.status === 'fail' ? -1 : 1) - (b.status === 'fail' ? -1 : 1));

  return {
    score,
    grade,
    checks,
    empty,
    topTip: notPass[0] || null,
    issues: notPass.length,
  };
}

// ---- Cores por grade ----

export function gradeColor(grade) {
  if (grade === 'Forte') return 'var(--accent)';
  if (grade === 'Bom') return 'oklch(0.8 0.13 80)';
  if (grade === 'Fraco') return 'oklch(0.66 0.19 28)';
  return 'var(--text-3)';
}

// ---- QualityFooter: rodapé expansível no resultado ----

export function renderQualityFooter(container, analysis) {
  if (!container || !analysis) return;

  let expanded = false;
  const { score, grade, checks, empty, topTip, issues } = analysis;

  const footer = document.createElement('div');
  footer.className = 'quality';

  const render = () => {
    footer.className = 'quality' + (expanded ? ' open' : '');
    footer.innerHTML = '';

    const size = 38;
    const r = (size - 6) / 2;
    const circ = 2 * Math.PI * r;
    const off = circ * (1 - (score || 0) / 100);
    const col = gradeColor(grade);
    const displayScore = grade === '—' ? '–' : score;

    const hd = document.createElement('button');
    hd.type = 'button';
    hd.className = 'quality-hd';
    hd.setAttribute('aria-expanded', String(expanded));
    hd.setAttribute('aria-label', t('quality.expand'));
    hd.innerHTML = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="score-ring" aria-hidden="true">
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--line-2,#333)" stroke-width="3.5"/>
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${col}" stroke-width="3.5"
          stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${off}"
          transform="rotate(-90 ${size / 2} ${size / 2})"
          style="transition:stroke-dashoffset .4s ease,stroke .3s"/>
        <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle"
          style="font-size:${size * 0.3}px;font-weight:700;fill:var(--text);font-family:var(--font-mono,monospace)">${displayScore}</text>
      </svg>
      <span class="q-sum">
        <strong style="color:${col}">${t('quality.title')}: ${grade}</strong>
        <span class="q-line">${
          empty ? t('quality.empty') : topTip ? topTip.tip : t('quality.all.pass')
        }</span>
      </span>
      <span class="q-meta">
        ${!empty && issues > 0 ? `<span class="q-count">${issues}</span>` : ''}
        <span class="q-chev" aria-hidden="true">${expanded ? '▲' : '▼'}</span>
      </span>
    `;

    hd.addEventListener('click', () => {
      expanded = !expanded;
      render();
      if (expanded) track('quality_expand');
    });

    footer.appendChild(hd);

    if (expanded) {
      const ul = document.createElement('ul');
      ul.className = 'q-checks';
      checks.forEach((c) => {
        const li = document.createElement('li');
        li.className = `q-check ${c.status}`;

        const ic = document.createElement('span');
        ic.className = `q-ic ${c.status}`;
        ic.setAttribute('aria-hidden', 'true');
        ic.textContent = c.status === 'pass' ? '✓' : c.status === 'warn' ? '!' : '✗';

        const txt = document.createElement('div');
        txt.className = 'q-txt';
        txt.innerHTML = `<div class="q-label">${escHtml(c.label)} <span class="q-ref">${escHtml(c.ref)}</span></div><div class="q-tip">${escHtml(c.tip)}</div>`;

        li.append(ic, txt);
        ul.appendChild(li);
      });
      footer.appendChild(ul);
    }
  };

  render();
  container.appendChild(footer);
}

function escHtml(s) {
  return String(s || '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}

// Importado e usado por telemetry
function track(event, props) {
  if (window.PE && window.PE.track) window.PE.track(event, props);
}
