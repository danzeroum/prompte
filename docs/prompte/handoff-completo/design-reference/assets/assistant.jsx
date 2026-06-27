/* assistant.jsx — Assistente de Qualidade do Prompt ("lint" de prompt).
   Avalia o prompt ao vivo contra boas práticas de engenharia de prompt
   (contexto, entrada concreta, formato de saída, restrições, anti-ambiguidade,
   detalhamento) e devolve um score + checagens acionáveis.
   Exporta: analyzePrompt, ScoreRing, QualityFooter, ScoreChip. */

const VAGUE_TERMS = ['melhor', 'bom', 'boa', 'rápido', 'rapido', 'eficiente', 'otimizado',
  'moderno', 'robusto', 'escalável', 'escalavel', 'limpo', 'simples', 'adequado', 'legal'];

function analyzePrompt(tpl, form, text) {
  text = text || '';
  const empty = !text.trim();
  const textFields = tpl.fields.filter((f) => f.type !== 'checkbox');
  const checkboxes = tpl.fields.filter((f) => f.type === 'checkbox');
  const filled = textFields.map((f) => ({ f, v: String(form[f.id] || '').trim() }));
  const allInputs = filled.map((x) => x.v).join('\n');
  const checkedCount = checkboxes.filter((f) => form[f.id]).length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const checks = [];

  // 1. Objetivo & papel — verbo de tarefa explícito (templates sempre fornecem)
  checks.push({
    id: 'goal', label: 'Objetivo e papel definidos',
    status: !empty ? 'pass' : 'fail', ref: 'Instrução explícita',
    tip: !empty ? 'Abre com um verbo de tarefa claro e um papel para a IA.'
                : 'Escolha um template para definir a tarefa.',
  });

  // 2. Contexto suficiente
  const ctxFields = filled.filter((x) => /contexto|requisito|perfil|objetivo|gargalo|funcionalidade|o que/i.test(x.f.label));
  const ctxChars = ctxFields.reduce((s, x) => s + x.v.length, 0);
  checks.push({
    id: 'context', label: 'Contexto suficiente', ref: 'Dar contexto',
    status: ctxFields.length === 0 ? 'pass' : ctxChars >= 60 ? 'pass' : ctxChars >= 15 ? 'warn' : 'fail',
    tip: ctxChars >= 60 || ctxFields.length === 0 ? 'Há background suficiente para a IA situar a resposta.'
       : 'Descreva o que o código faz e onde roda — modelos respondem melhor com contexto.',
  });

  // 3. Entrada concreta (código / arquivo / repo)
  const inFields = filled.filter((x) => /código|codigo|arquivo|reposit|componente|erro|diff|trecho/i.test(x.f.label));
  const hasInput = inFields.some((x) => x.v.length > 0);
  checks.push({
    id: 'input', label: 'Entrada concreta fornecida', ref: 'Dados, não suposições',
    status: inFields.length === 0 ? 'pass' : hasInput ? 'pass' : 'fail',
    tip: inFields.length === 0 || hasInput ? 'A IA tem código/arquivo/repo real para trabalhar.'
       : 'Cole o código ou aponte o arquivo/repo — sem isso a resposta vira genérica.',
  });

  // 4. Formato de saída especificado
  const hasFormat = /(formato de resposta|entregue|entregar|fa[çc]a:|fazer:|formato|entregue:)/i.test(text) || /\n\s*\d+\./.test(text);
  checks.push({
    id: 'format', label: 'Formato de saída especificado', ref: 'Definir o formato',
    status: empty ? 'fail' : hasFormat ? 'pass' : 'warn',
    tip: hasFormat ? 'Pede entregáveis e estrutura claros (lista, diff, tabela…).'
       : 'Defina o formato esperado da resposta.',
  });

  // 5. Restrições & critérios
  const hasConstraints = checkedCount > 0 || /(restri|regras|obrigat|n[ãa]o sacrific|sla|crit[ée]rio|severidade|priorize|priorizar|mantenha|mantendo|evite|compatib)/i.test(text);
  checks.push({
    id: 'constraints', label: 'Restrições e critérios', ref: 'Definir limites',
    status: empty ? 'fail' : hasConstraints ? 'pass' : 'warn',
    tip: hasConstraints ? 'Há limites e critérios guiando a resposta.'
       : 'Adicione restrições: o que evitar, prioridades, critérios de aceite.',
  });

  // 6. Anti-ambiguidade (termos vagos sem métrica)
  const found = [...new Set((allInputs.toLowerCase().match(new RegExp('\\b(' + VAGUE_TERMS.join('|') + ')\\b', 'gi')) || []).map((v) => v.toLowerCase()))];
  checks.push({
    id: 'specific', label: 'Sem termos vagos', ref: 'Evitar ambiguidade',
    status: found.length === 0 ? 'pass' : 'warn',
    tip: found.length === 0 ? 'Sem adjetivos vagos soltos nos seus campos.'
       : `Termos vagos: “${found.slice(0, 3).join('”, “')}”. Troque por critérios mensuráveis (ex.: “< 100ms”, “sem N+1”).`,
  });

  // 7. Detalhamento
  checks.push({
    id: 'depth', label: 'Detalhamento adequado', ref: 'Especificar reduz suposição',
    status: words >= 80 ? 'pass' : words >= 35 ? 'warn' : 'fail',
    tip: words >= 80 ? 'Prompt bem detalhado.'
       : 'Prompt curto — preencha mais campos para a IA supor menos.',
  });

  const W = { pass: 1, warn: 0.5, fail: 0 };
  const score = empty ? 0 : Math.round((100 * checks.reduce((s, c) => s + W[c.status], 0)) / checks.length);
  const grade = empty ? '—' : score >= 80 ? 'Forte' : score >= 55 ? 'Bom' : 'Fraco';
  const top = checks.filter((c) => c.status !== 'pass').sort((a, b) => (a.status === 'fail' ? -1 : 1) - (b.status === 'fail' ? -1 : 1));
  return { score, grade, checks, empty, topTip: top[0] || null, issues: top.length };
}

function gradeColor(grade) {
  if (grade === 'Forte') return 'var(--accent)';
  if (grade === 'Bom') return 'oklch(0.8 0.13 80)';
  if (grade === 'Fraco') return 'oklch(0.66 0.19 28)';
  return 'var(--text-3)';
}

function ScoreRing({ score, grade, size = 38 }) {
  const r = (size - 6) / 2, c = 2 * Math.PI * r;
  const off = c * (1 - (score || 0) / 100);
  const col = gradeColor(grade);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="score-ring" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-2)" strokeWidth="3.5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth="3.5" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off} transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.3s' }} />
      <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle"
        style={{ fontSize: size * 0.3, fontWeight: 700, fill: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
        {grade === '—' ? '–' : score}
      </text>
    </svg>
  );
}

function StatusIcon({ status }) {
  if (status === 'pass') return <span className="q-ic pass"><IconCheck width="12" height="12" /></span>;
  if (status === 'warn') return <span className="q-ic warn">!</span>;
  return <span className="q-ic fail"><IconClose width="11" height="11" /></span>;
}

/* rodapé compacto no painel de prévia; expande a lista de checagens */
function QualityFooter({ analysis, expanded, onToggle }) {
  const { score, grade, checks, empty, topTip, issues } = analysis;
  return (
    <div className={'quality' + (expanded ? ' open' : '')}>
      <button className="quality-hd" onClick={onToggle} aria-expanded={expanded}>
        <ScoreRing score={score} grade={grade} />
        <span className="q-sum">
          <strong style={{ color: gradeColor(grade) }}>Qualidade: {grade}</strong>
          <span className="q-line">{empty ? 'Preencha os campos para avaliar'
            : topTip ? topTip.tip : 'Todas as boas práticas atendidas ✓'}</span>
        </span>
        <span className="q-meta">
          {!empty && issues > 0 && <span className="q-count">{issues}</span>}
          <span className="q-chev"><IconChevron /></span>
        </span>
      </button>
      {expanded && (
        <ul className="q-checks">
          {checks.map((c) => (
            <li key={c.id} className={'q-check ' + c.status}>
              <StatusIcon status={c.status} />
              <div className="q-txt">
                <div className="q-label">{c.label} <span className="q-ref">{c.ref}</span></div>
                <div className="q-tip">{c.tip}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* chip compacto p/ o cabeçalho do resultado */
function ScoreChip({ analysis }) {
  const { score, grade } = analysis;
  return (
    <span className="score-chip" title="Qualidade do prompt (boas práticas de engenharia de prompt)">
      <ScoreRing score={score} grade={grade} size={30} />
      <span style={{ color: gradeColor(grade), fontWeight: 600 }}>{grade}</span>
    </span>
  );
}

Object.assign(window, { analyzePrompt, ScoreRing, QualityFooter, ScoreChip, gradeColor });
