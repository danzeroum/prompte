import { analyzePrompt } from '../assets/js/promptQuality.js';

// Template de teste que cobre os principais padrões de id
const TPL_REVISAO = {
  id: 'revisao-correcao',
  fields: [
    { id: 'rc-linguagem',  type: 'text' },
    { id: 'rc-contexto',   type: 'text' },
    { id: 'rc-codigo',     type: 'textarea' },
    { id: 'rc-problemas',  type: 'textarea' },
  ],
};

// Template sem campos de contexto ou código (ex.: template de texto)
const TPL_SIMPLES = {
  id: 'simples',
  fields: [
    { id: 'titulo', type: 'text' },
  ],
};

// Template com checkboxes
const TPL_COM_CHECK = {
  id: 'refactor',
  fields: [
    { id: 'rf-contexto',    type: 'text' },
    { id: 'rf-prioridade',  type: 'checkbox' },
  ],
};

// ---- Estado vazio ----
describe('analyzePrompt — estado vazio', () => {
  it('retorna score 0 e grade "—" para texto vazio', () => {
    const r = analyzePrompt(TPL_REVISAO, {}, '');
    expect(r.score).toBe(0);
    expect(r.grade).toBe('—');
    expect(r.empty).toBe(true);
  });

  it('retorna score 0 e grade "—" para texto só espaços', () => {
    const r = analyzePrompt(TPL_REVISAO, {}, '   ');
    expect(r.score).toBe(0);
    expect(r.grade).toBe('—');
  });

  it('com vazio, todas as checagens goal/format/constraints são fail', () => {
    const r = analyzePrompt(TPL_REVISAO, {}, '');
    expect(r.checks.find(c => c.id === 'goal').status).toBe('fail');
    expect(r.checks.find(c => c.id === 'format').status).toBe('fail');
    expect(r.checks.find(c => c.id === 'constraints').status).toBe('fail');
  });
});

// ---- Checagem 1: Objetivo ----
describe('check 1 — objetivo', () => {
  it('pass quando há texto gerado', () => {
    const r = analyzePrompt(TPL_REVISAO, {}, 'Revise o seguinte código.');
    expect(r.checks.find(c => c.id === 'goal').status).toBe('pass');
  });

  it('fail quando texto está vazio', () => {
    const r = analyzePrompt(TPL_REVISAO, {}, '');
    expect(r.checks.find(c => c.id === 'goal').status).toBe('fail');
  });
});

// ---- Checagem 2: Contexto (casamento por ID, não label) ----
describe('check 2 — contexto (por ID)', () => {
  it('pass quando campo -contexto tem >= 60 chars', () => {
    const data = { 'rc-contexto': 'A'.repeat(60) };
    const r = analyzePrompt(TPL_REVISAO, data, 'Revise o código abaixo.');
    expect(r.checks.find(c => c.id === 'context').status).toBe('pass');
  });

  it('warn quando campo -contexto tem 15..59 chars', () => {
    const data = { 'rc-contexto': 'A'.repeat(30) };
    const r = analyzePrompt(TPL_REVISAO, data, 'Revise o código.');
    expect(r.checks.find(c => c.id === 'context').status).toBe('warn');
  });

  it('fail quando campo -contexto tem < 15 chars', () => {
    const data = { 'rc-contexto': 'curto' };
    const r = analyzePrompt(TPL_REVISAO, data, 'Revise o código.');
    expect(r.checks.find(c => c.id === 'context').status).toBe('fail');
  });

  it('pass quando não há campo de contexto no template (sem penalidade)', () => {
    const r = analyzePrompt(TPL_SIMPLES, { titulo: 'teste' }, 'Texto gerado sem contexto.');
    expect(r.checks.find(c => c.id === 'context').status).toBe('pass');
  });

  it('não casa por label — campo rc-linguagem não é contexto', () => {
    // rc-linguagem NÃO tem -contexto no id, então não entra na checagem 2
    const data = { 'rc-linguagem': 'A'.repeat(80) };
    const r = analyzePrompt(TPL_REVISAO, data, 'Revise o código.');
    // sem campo de contexto preenchido → fail (rc-contexto existe mas está vazio)
    expect(r.checks.find(c => c.id === 'context').status).toBe('fail');
  });
});

// ---- Checagem 3: Entrada concreta (casamento por ID) ----
describe('check 3 — entrada concreta (por ID)', () => {
  it('pass quando campo -codigo está preenchido', () => {
    const data = { 'rc-codigo': 'function foo() { return 1; }' };
    const r = analyzePrompt(TPL_REVISAO, data, 'Revise o código.');
    expect(r.checks.find(c => c.id === 'input').status).toBe('pass');
  });

  it('fail quando campo -codigo existe mas está vazio', () => {
    const data = { 'rc-codigo': '' };
    const r = analyzePrompt(TPL_REVISAO, data, 'Revise o código.');
    expect(r.checks.find(c => c.id === 'input').status).toBe('fail');
  });

  it('pass quando não há campo de entrada no template', () => {
    const r = analyzePrompt(TPL_SIMPLES, {}, 'Texto gerado.');
    expect(r.checks.find(c => c.id === 'input').status).toBe('pass');
  });
});

// ---- Checagem 4: Formato ----
describe('check 4 — formato', () => {
  it('pass quando texto contém "formato de resposta"', () => {
    const r = analyzePrompt(TPL_REVISAO, {}, 'Revise. Formato de resposta: lista.');
    expect(r.checks.find(c => c.id === 'format').status).toBe('pass');
  });

  it('pass quando texto tem lista numerada', () => {
    const r = analyzePrompt(TPL_REVISAO, {}, 'Revise:\n1. Bug aqui\n2. Bug lá.');
    expect(r.checks.find(c => c.id === 'format').status).toBe('pass');
  });

  it('warn quando texto não especifica formato', () => {
    const r = analyzePrompt(TPL_REVISAO, {}, 'Revise o código a seguir.');
    expect(r.checks.find(c => c.id === 'format').status).toBe('warn');
  });
});

// ---- Checagem 5: Restrições ----
describe('check 5 — restrições', () => {
  it('pass quando há checkbox marcado', () => {
    const data = { 'rf-prioridade': true };
    const r = analyzePrompt(TPL_COM_CHECK, data, 'Refatore com base nas prioridades.');
    expect(r.checks.find(c => c.id === 'constraints').status).toBe('pass');
  });

  it('pass quando texto contém "evite"', () => {
    const r = analyzePrompt(TPL_REVISAO, {}, 'Revise e evite soluções lentas.');
    expect(r.checks.find(c => c.id === 'constraints').status).toBe('pass');
  });

  it('warn quando não há restrição', () => {
    const r = analyzePrompt(TPL_REVISAO, {}, 'Revise o seguinte trecho de código.');
    expect(r.checks.find(c => c.id === 'constraints').status).toBe('warn');
  });
});

// ---- Checagem 6: Anti-ambiguidade ----
describe('check 6 — termos vagos', () => {
  it('pass quando não há termos vagos', () => {
    const data = { 'rc-contexto': 'Sistema de pagamentos com latência < 100ms.' };
    const r = analyzePrompt(TPL_REVISAO, data, 'Revise o código.');
    expect(r.checks.find(c => c.id === 'specific').status).toBe('pass');
  });

  it('warn quando há termos vagos nos campos', () => {
    const data = { 'rc-contexto': 'Quero um código limpo e moderno e rápido.' };
    const r = analyzePrompt(TPL_REVISAO, data, 'Revise o código.');
    expect(r.checks.find(c => c.id === 'specific').status).toBe('warn');
  });

  it('tip menciona os termos encontrados', () => {
    const data = { 'rc-contexto': 'código limpo e simples' };
    const r = analyzePrompt(TPL_REVISAO, data, 'Revise o código.');
    const check = r.checks.find(c => c.id === 'specific');
    expect(check.status).toBe('warn');
    expect(check.tip).toMatch(/limpo|simples/);
  });
});

// ---- Checagem 7: Detalhamento ----
describe('check 7 — detalhamento', () => {
  it('pass para >= 80 palavras', () => {
    const text = Array(80).fill('palavra').join(' ');
    const r = analyzePrompt(TPL_REVISAO, {}, text);
    expect(r.checks.find(c => c.id === 'depth').status).toBe('pass');
  });

  it('warn para 35-79 palavras', () => {
    const text = Array(40).fill('palavra').join(' ');
    const r = analyzePrompt(TPL_REVISAO, {}, text);
    expect(r.checks.find(c => c.id === 'depth').status).toBe('warn');
  });

  it('fail para < 35 palavras', () => {
    const text = 'palavra '.repeat(10).trim();
    const r = analyzePrompt(TPL_REVISAO, {}, text);
    expect(r.checks.find(c => c.id === 'depth').status).toBe('fail');
  });
});

// ---- Score e grade ----
describe('score e grade', () => {
  it('score 0 e grade "—" quando vazio', () => {
    const r = analyzePrompt(TPL_REVISAO, {}, '');
    expect(r.score).toBe(0);
    expect(r.grade).toBe('—');
  });

  it('grade Forte quando score >= 80', () => {
    // Preenche tudo para maximizar score
    const text = Array(80).fill('palavra').join(' ') +
      ' formato de resposta lista evite bugs mantenha padrões.';
    const data = {
      'rc-contexto': 'A'.repeat(70),
      'rc-codigo': 'function foo() {}',
    };
    const r = analyzePrompt(TPL_REVISAO, data, text);
    expect(r.score).toBeGreaterThanOrEqual(80);
    expect(r.grade).toBe('Forte');
  });

  it('grade Fraco para texto curto sem campos', () => {
    const r = analyzePrompt(TPL_REVISAO, {}, 'Revise.');
    expect(r.grade).toBe('Fraco');
  });

  it('issues conta não-pass', () => {
    const r = analyzePrompt(TPL_REVISAO, {}, 'Revise o código.');
    expect(r.issues).toBeGreaterThan(0);
    expect(r.issues).toBe(r.checks.filter(c => c.status !== 'pass').length);
  });

  it('topTip é fail antes de warn', () => {
    // Com texto curto e sem contexto: goal=pass, context=fail, depth=fail...
    const r = analyzePrompt(TPL_REVISAO, { 'rc-contexto': 'curto' }, 'Revise.');
    if (r.topTip) {
      // topTip deve ser o primeiro fail (não warn)
      const fails = r.checks.filter(c => c.status === 'fail');
      if (fails.length > 0) {
        expect(r.topTip.status).toBe('fail');
      }
    }
  });

  it('retorna exatamente 7 checagens', () => {
    const r = analyzePrompt(TPL_REVISAO, {}, 'Texto de teste.');
    expect(r.checks).toHaveLength(7);
  });
});
