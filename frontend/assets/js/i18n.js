// i18n.js — internacionalização leve baseada em atributos data-i18n.
// Uso no HTML: <span data-i18n="topbar.settings">Preferências</span>
//              <input data-i18n-attr="placeholder" data-i18n="form.repo">
// pt está completo para a "chrome" da aplicação (controles, toasts, menus);
// en é um stub a ser expandido. Tagear o conteúdo das páginas é incremental.

import { getPreferences, setPreference } from './preferences.js';

export const DICT = {
  pt: {
    'topbar.settings': 'Preferências',
    'topbar.toggleTheme': 'Alternar tema claro/escuro',
    'menu.appearance': 'Aparência',
    'menu.theme.light': 'Tema claro',
    'menu.theme.dark': 'Tema escuro',
    'menu.theme.system': 'Seguir o sistema',
    'menu.language': 'Idioma',
    'menu.data': 'Dados',
    'menu.export': 'Exportar preferências',
    'menu.import': 'Importar preferências',
    'history.title': 'Histórico de prompts',
    'history.empty': 'Nenhum prompt gerado ainda.',
    'history.copy': 'Copiar',
    'history.clear': 'Limpar histórico',
    'history.clear.q': 'Limpar {n} prompt(s) do histórico? Esta ação não pode ser desfeita.',
    'history.clear.confirm': 'Sim, limpar',
    'history.clear.cancel': 'Cancelar',
    'history.clear.done': 'Histórico limpo.',
    'toast.copied.title': 'Copiado!',
    'toast.copied.body': 'O prompt foi copiado para a área de transferência.',
    'toast.copyError.title': 'Não foi possível copiar',
    'toast.copyError.body': 'Copie manualmente selecionando o texto.',
    'toast.missing.title': 'Campos obrigatórios',
    'toast.missing.body': 'Preencha os campos destacados antes de gerar.',
    'toast.exported.title': 'Preferências exportadas',
    'toast.imported.title': 'Preferências importadas',
    'toast.importError.title': 'Falha ao importar',
    'playground.title': 'Experimente',
    'playground.run': 'Gerar Prompt de Exemplo',
    'menu.account': 'Conta',
    'menu.signin': 'Entrar',
    'menu.signout': 'Sair',
    'auth.title': 'Entrar',
    'auth.desc': 'Receba um link mágico por e-mail. Usuários autenticados têm limite maior.',
    'auth.emailPlaceholder': 'seu@email.com',
    'auth.send': 'Enviar link mágico',
    'auth.sent': 'Link enviado! Verifique seu e-mail.',
    'auth.invalidEmail': 'Informe um e-mail válido.',
    'auth.error': 'Não foi possível enviar o link.',
    'auth.close': 'Fechar',
    'auth.signedInAs': 'Conectado como',
    'auth.signedOut': 'Você saiu da conta.',
    'chat.open': 'Abrir o assistente',
    'chat.close': 'Fechar',
    'chat.title': 'Assistente de Prompts',
    'chat.placeholder': 'Descreva o que você precisa…',
    'chat.send': 'Enviar',
    'chat.greeting':
      'Olá! Conte o que você quer fazer (ex.: revisar o arquivo auth.js do meu repositório) e eu monto o prompt ideal.',
    'chat.thinking': 'Pensando…',
    'chat.error': 'Não foi possível responder agora.',
    'chat.rateLimited': 'Limite de requisições atingido. Tente novamente em alguns minutos.',
    'chat.rateLimitedCountdown': 'Limite atingido. Tente novamente em {seconds}s.',
    // Banner de degradação graciosa (#M8)
    'banner.offline.title': 'Modo offline',
    'banner.offline.body':
      'Sem conexão com o backend: o chat e as respostas com IA estão indisponíveis. A geração de prompts pelos templates continua funcionando normalmente.',
    'banner.dismiss': 'Dispensar',
    'palette.title': 'Busca rápida',
    'palette.placeholder': 'Buscar páginas, templates e seções…',
    'palette.page': 'Página',
    'palette.template': 'Template',
    'palette.section': 'Seção',
    // Conteúdo do gerador (#M6): seções da sidebar e descrições dos templates.
    'gen.section.nav': 'Navegação',
    'gen.section.codigo': 'Código Direto',
    'gen.section.repo': 'Análise de Repositório',
    'gen.section.diff': 'Melhoria com Diff',
    'gen.section.avancado': 'Domínios Avançados',
    'gen.desc.revisao-correcao':
      'Revise e corrija um codigo, identificando bugs, problemas de logica e sugerindo correcoes prontas para aplicar.',
    'gen.desc.melhoria-refatoracao':
      'Melhore um codigo existente priorizando performance, legibilidade e boas praticas.',
    'gen.desc.tela-para-github':
      'Prepare codigo copiado da tela para commit no GitHub, corrigindo formatacao, caracteres e indentacao.',
    'gen.desc.debug-erros':
      'Diagnostique erros no codigo com base na mensagem de erro e no comportamento observado.',
    'gen.desc.criar-do-zero':
      'Crie codigo do zero com requisitos especificos, restricoes e estilo definidos.',
    'gen.desc.explicar-codigo':
      'Receba uma explicacao detalhada de um codigo, ajustada ao seu nivel de conhecimento.',
    'gen.desc.analise-geral':
      'Obtenha uma visao ampla e completa de um repositorio: estrutura, qualidade, seguranca e documentacao.',
    'gen.desc.analise-especifica':
      'Investigue algo especifico no repositorio: um modulo, um bug recorrente, ou prepare-se para um PR.',
    'gen.desc.analise-comparativa':
      'Compare duas versoes, branches ou estados de um repositorio para identificar mudancas significativas.',
    'gen.desc.refatoracao-orientada':
      'Proponha refatoracoes completas com codigo pronto, priorizando os criterios que voce definir.',
    'gen.desc.diff-arquivo':
      'Analise um arquivo e gere o diff completo corrigido, coerente com os padroes do projeto.',
    'gen.desc.diff-modulo':
      'Analise um diretorio inteiro, identifique inconsistencias e gere diffs completos para cada arquivo.',
    'gen.desc.diff-react':
      'Refatore componentes React gerando diffs completos, seguindo os padroes do projeto.',
    'gen.desc.diff-api':
      'Refatore endpoints e servicos de backend com foco em seguranca, performance e consistencia.',
    'gen.desc.diff-testes':
      'Revise e melhore testes existentes, identifique gaps de coverage e gere testes faltantes.',
    'gen.desc.diff-performance':
      'Analise com foco exclusivo em performance: identifique gargalos e gere diffs otimizados.',
    'gen.desc.diff-canivete':
      'Analise completa e flexivel: gera diffs prontos para aplicar em qualquer escopo do repositorio.',
    'gen.desc.cloud-review':
      'Revise codigo e infraestrutura em nuvem com foco em seguranca (responsabilidade compartilhada), modelos de servico (SaaS/PaaS/IaaS), conformidade (LGPD, NIST) e boas praticas cloud-native.',
    'gen.desc.requisitos-review':
      'Analise codigo verificando se os requisitos (funcionais e nao funcionais) foram implementados corretamente, se historias de usuario seguem INVEST e se ha gaps entre especificacao e codigo.',
    'gen.desc.agile-review':
      'Revise codigo com foco em praticas ageis: BDD (Given-When-Then), artefatos Scrum (burndown, DoD), metricas de fluxo (lead time, throughput) e priorizacao por valor (WSJF).',
    'gen.desc.ia-ml-review':
      'Revise codigo de IA/ML com foco em etica e vies, qualidade dos dados, overfitting/generalizacao, seguranca adversarial e conformidade com LGPD para dados sensiveis.',
    'gen.desc.dados-pipeline':
      'Revise pipelines e arquiteturas de dados com foco nos 5 Vs do Big Data, qualidade ETL, design de microsservicos de dados e ciclo completo de analise (SMART).',
    'gen.desc.gestao-projeto':
      'Analise o projeto sob a perspectiva de gestao: escopo (EAP), riscos (probabilidade/impacto), stakeholders (poder/interesse), modelo de gestao adequado e PMBOK.',
    'gen.desc.metricas-okr':
      'Analise entregas e codigo sob a lente de metricas: OKR (output vs outcome), fluxo (Lead Time, Throughput, WIP), eficiencia vs eficacia, e previsibilidade (Monte Carlo).',
    'gen.desc.squads-review':
      'Revise codigo sob a perspectiva de dinamica de squads: estrutura multifuncional, OKRs do time, competencias necessarias, fase do time (Tuckman) e lideranca positiva.',
  },
  en: {
    'topbar.settings': 'Preferences',
    'topbar.toggleTheme': 'Toggle light/dark theme',
    'menu.appearance': 'Appearance',
    'menu.theme.light': 'Light theme',
    'menu.theme.dark': 'Dark theme',
    'menu.theme.system': 'Follow system',
    'menu.language': 'Language',
    'menu.data': 'Data',
    'menu.export': 'Export preferences',
    'menu.import': 'Import preferences',
    'history.title': 'Prompt history',
    'history.empty': 'No prompts generated yet.',
    'history.copy': 'Copy',
    'history.clear': 'Clear history',
    'history.clear.q': 'Clear {n} prompt(s) from history? This action cannot be undone.',
    'history.clear.confirm': 'Yes, clear',
    'history.clear.cancel': 'Cancel',
    'history.clear.done': 'History cleared.',
    'toast.copied.title': 'Copied!',
    'toast.copied.body': 'The prompt was copied to the clipboard.',
    'toast.copyError.title': 'Could not copy',
    'toast.copyError.body': 'Copy manually by selecting the text.',
    'toast.missing.title': 'Required fields',
    'toast.missing.body': 'Fill in the highlighted fields before generating.',
    'toast.exported.title': 'Preferences exported',
    'toast.imported.title': 'Preferences imported',
    'toast.importError.title': 'Import failed',
    'playground.title': 'Try it',
    'playground.run': 'Generate sample prompt',
    'menu.account': 'Account',
    'menu.signin': 'Sign in',
    'menu.signout': 'Sign out',
    'auth.title': 'Sign in',
    'auth.desc': 'Get a magic link by email. Signed-in users get a higher limit.',
    'auth.emailPlaceholder': 'you@email.com',
    'auth.send': 'Send magic link',
    'auth.sent': 'Link sent! Check your email.',
    'auth.invalidEmail': 'Enter a valid email.',
    'auth.error': 'Could not send the link.',
    'auth.close': 'Close',
    'auth.signedInAs': 'Signed in as',
    'auth.signedOut': 'You have signed out.',
    'chat.open': 'Open the assistant',
    'chat.close': 'Close',
    'chat.title': 'Prompt Assistant',
    'chat.placeholder': 'Describe what you need…',
    'chat.send': 'Send',
    'chat.greeting':
      "Hi! Tell me what you want to do (e.g. review auth.js in my repo) and I'll craft the ideal prompt.",
    'chat.thinking': 'Thinking…',
    'chat.error': 'Could not respond right now.',
    'chat.rateLimited': 'Rate limit reached. Try again in a few minutes.',
    'chat.rateLimitedCountdown': 'Rate limit reached. Try again in {seconds}s.',
    // Graceful degradation banner (#M8)
    'banner.offline.title': 'Offline mode',
    'banner.offline.body':
      'No connection to the backend: chat and AI answers are unavailable. Generating prompts from templates still works normally.',
    'banner.dismiss': 'Dismiss',
    'palette.title': 'Quick search',
    'palette.placeholder': 'Search pages, templates and sections…',
    'palette.page': 'Page',
    'palette.template': 'Template',
    'palette.section': 'Section',
    // Generator content (#M6): sidebar sections and template descriptions.
    'gen.section.nav': 'Navigation',
    'gen.section.codigo': 'Direct Code',
    'gen.section.repo': 'Repository Analysis',
    'gen.section.diff': 'Diff Improvement',
    'gen.section.avancado': 'Advanced Domains',
    'gen.desc.revisao-correcao':
      'Review and fix code, spotting bugs and logic issues and suggesting ready-to-apply fixes.',
    'gen.desc.melhoria-refatoracao':
      'Improve existing code prioritizing performance, readability and best practices.',
    'gen.desc.tela-para-github':
      'Prepare code copied from the screen for a GitHub commit, fixing formatting, characters and indentation.',
    'gen.desc.debug-erros':
      'Diagnose errors in code based on the error message and the observed behavior.',
    'gen.desc.criar-do-zero':
      'Create code from scratch with specific requirements, constraints and a defined style.',
    'gen.desc.explicar-codigo':
      'Get a detailed explanation of a piece of code, tailored to your level of knowledge.',
    'gen.desc.analise-geral':
      'Get a broad, complete view of a repository: structure, quality, security and documentation.',
    'gen.desc.analise-especifica':
      'Investigate something specific in the repo: a module, a recurring bug, or prepare for a PR.',
    'gen.desc.analise-comparativa':
      'Compare two versions, branches or states of a repository to spot significant changes.',
    'gen.desc.refatoracao-orientada':
      'Propose complete refactorings with ready-to-use code, prioritizing the criteria you choose.',
    'gen.desc.diff-arquivo':
      'Analyze a file and produce the full corrected diff, consistent with the project conventions.',
    'gen.desc.diff-modulo':
      'Analyze an entire directory, find inconsistencies and produce complete diffs for each file.',
    'gen.desc.diff-react':
      'Refactor React components producing complete diffs, following the project conventions.',
    'gen.desc.diff-api':
      'Refactor backend endpoints and services focusing on security, performance and consistency.',
    'gen.desc.diff-testes':
      'Review and improve existing tests, find coverage gaps and generate missing tests.',
    'gen.desc.diff-performance':
      'Analyze with an exclusive focus on performance: find bottlenecks and produce optimized diffs.',
    'gen.desc.diff-canivete':
      'Complete, flexible analysis: produces ready-to-apply diffs for any scope of the repository.',
    'gen.desc.cloud-review':
      'Review cloud code and infrastructure focusing on security (shared responsibility), service models (SaaS/PaaS/IaaS), compliance (LGPD, NIST) and cloud-native best practices.',
    'gen.desc.requisitos-review':
      'Analyze code to check whether requirements (functional and non-functional) were implemented correctly, whether user stories follow INVEST and whether there are gaps between spec and code.',
    'gen.desc.agile-review':
      'Review code focusing on agile practices: BDD (Given-When-Then), Scrum artifacts (burndown, DoD), flow metrics (lead time, throughput) and value-based prioritization (WSJF).',
    'gen.desc.ia-ml-review':
      'Review AI/ML code focusing on ethics and bias, data quality, overfitting/generalization, adversarial security and LGPD compliance for sensitive data.',
    'gen.desc.dados-pipeline':
      'Review data pipelines and architectures focusing on the 5 Vs of Big Data, ETL quality, data microservices design and the full analysis cycle (SMART).',
    'gen.desc.gestao-projeto':
      'Analyze the project from a management perspective: scope (WBS), risks (probability/impact), stakeholders (power/interest), a suitable management model and PMBOK.',
    'gen.desc.metricas-okr':
      'Analyze deliveries and code through metrics: OKR (output vs outcome), flow (Lead Time, Throughput, WIP), efficiency vs effectiveness, and predictability (Monte Carlo).',
    'gen.desc.squads-review':
      'Review code from a squad-dynamics perspective: cross-functional structure, team OKRs, required skills, team phase (Tuckman) and positive leadership.',
  },
};

let currentLang = 'pt';

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  currentLang = DICT[lang] ? lang : 'pt';
  setPreference('lang', currentLang);
  document.documentElement.setAttribute('lang', currentLang === 'pt' ? 'pt-BR' : 'en');
  applyI18n();
  return currentLang;
}

// Traduz uma chave; cai no português e, por fim, na própria chave.
export function t(key, lang = currentLang) {
  return (DICT[lang] && DICT[lang][key]) || DICT.pt[key] || key;
}

// Aplica traduções a todos os elementos [data-i18n] dentro de root.
export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const attr = el.getAttribute('data-i18n-attr');
    const value = t(key);
    if (attr) el.setAttribute(attr, value);
    else el.textContent = value;
  });
}

export function initI18n() {
  currentLang = getPreferences().lang || 'pt';
  if (!DICT[currentLang]) currentLang = 'pt';
  document.documentElement.setAttribute('lang', currentLang === 'pt' ? 'pt-BR' : 'en');
  applyI18n();
}
