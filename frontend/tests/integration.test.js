// integration.test.js — testes de integração (jsdom) do fluxo do gerador:
// monta um fragmento mínimo de DOM com os IDs reais dos campos, coleta os
// valores via collectFormData() (mesma função usada por generator.html) e
// confirma que buildPrompt() produz o prompt esperado — simulando o caminho
// real "preencher campos → gerar".

import { buildPrompt, collectFormData, generatorTemplates } from '../assets/js/generators.js';

afterEach(() => {
  document.body.innerHTML = '';
});

// Cria no DOM os elementos correspondentes aos campos de um template e aplica
// os valores informados (string para text/textarea/select, boolean p/ checkbox).
function mountPanel(templateKey, values = {}) {
  const tpl = generatorTemplates[templateKey];
  const frag = [];
  for (const f of tpl.fields) {
    const { id, type } = f;
    if (type === 'checkbox') {
      frag.push(`<input type="checkbox" id="${id}"${values[id] ? ' checked' : ''}>`);
    } else if (type === 'textarea') {
      frag.push(`<textarea id="${id}"></textarea>`);
    } else if (type === 'select') {
      const v = values[id] ?? '';
      frag.push(`<select id="${id}"><option value="${v}" selected>${v}</option></select>`);
    } else {
      frag.push(`<input type="text" id="${id}">`);
    }
  }
  document.body.innerHTML = frag.join('\n');
  // Valores de text/textarea precisam ser atribuídos após inserção.
  for (const f of tpl.fields) {
    if (f.type === 'text' || f.type === 'textarea') {
      const el = document.getElementById(f.id);
      if (values[f.id] != null) el.value = values[f.id];
    }
  }
}

describe('fluxo do gerador (preencher → coletar → gerar)', () => {
  it('coleta um template de código e gera o prompt esperado', () => {
    const values = {
      'rc-linguagem': 'Python',
      'rc-contexto': 'autenticação',
      'rc-codigo': 'def login(): pass',
      'rc-problemas': 'sem validação\nsem testes',
    };
    mountPanel('revisao-correcao', values);

    const collected = collectFormData('revisao-correcao');
    expect(collected).toMatchObject(values);

    const out = buildPrompt('revisao-correcao', collected);
    expect(out).toBe(buildPrompt('revisao-correcao', values));
    expect(out).toContain('Revise e corrija o seguinte codigo Python');
    expect(out).toContain('def login(): pass');
    expect(out).toContain('- sem validação');
  });

  it('coleta checkboxes marcados de um template avançado', () => {
    const values = {
      'cl-repo': '/infra',
      'cl-arquivo': 'main.tf',
      'cl-provider': 'AWS',
      'cl-contexto': 'revisão de segurança',
      'cl-sec': true,
      'cl-iac': true,
    };
    mountPanel('cloud-review', values);

    const collected = collectFormData('cloud-review');
    expect(collected['cl-sec']).toBe(true);
    expect(collected['cl-model']).toBe(false); // não marcado

    const out = buildPrompt('cloud-review', collected);
    expect(out).toContain('PROVEDOR DE NUVEM: AWS');
    expect(out).toContain('1. Seguranca (IAM, criptografia, flags)');
    expect(out).toContain('2. Infra as Code (Terraform/CloudFormation)');
    expect(out).not.toContain('Modelo de servico (SaaS/PaaS/IaaS)');
  });

  it('ignora campos ausentes no DOM sem quebrar', () => {
    document.body.innerHTML = '<input type="text" id="rc-linguagem">';
    document.getElementById('rc-linguagem').value = 'Go';
    const collected = collectFormData('revisao-correcao');
    expect(collected).toEqual({ 'rc-linguagem': 'Go' });
    expect(() => buildPrompt('revisao-correcao', collected)).not.toThrow();
  });
});
