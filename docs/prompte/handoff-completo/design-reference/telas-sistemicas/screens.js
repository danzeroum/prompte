/* screens.js — markup das telas sistêmicas + navegação/estado.
   Vanilla. Cada screen é uma função que devolve HTML. */
(function () {
  const ic = (id) => `<svg class="ic"><use href="#${id}"/></svg>`;

  // mini topbar de contexto da Biblioteca (reutilizada nos estados de conteúdo)
  const libTop = (title, sub) => `
    <div class="fr-pad" style="padding-bottom:0">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:20px">
        <div><h2 style="font-family:var(--font-display);font-size:24px;font-weight:700;letter-spacing:-.02em">${title}</h2>
        <p style="font-size:13.5px;color:var(--text-2);margin-top:4px">${sub}</p></div>
        <button class="pe-btn">${ic('i-bolt')} Novo prompt</button>
      </div>
    </div>`;

  const SCREENS = {
    /* ============ MANUAL (refino) ============ */
    manual: {
      title: 'Manual · refino', desc: 'Documentação + playground',
      scroll: true,
      note: 'Refinar, não refazer: TOC ancorada, escala tipográfica, glossário inline e playground reusando <code>generators.js</code>.',
      html: () => `<div class="man">
        <nav class="man-toc">
          <div class="sec">Começar</div>
          <a class="on">Visão geral</a>
          <a>Anatomia de um prompt</a>
          <a>Modos: Direto e Avançado</a>
          <div class="sec">Boas práticas</div>
          <a>Os 7 critérios</a>
          <a>Termos a evitar</a>
          <div class="sec">Recursos</div>
          <a>Playground</a>
          <a>Atalhos</a>
        </nav>
        <article class="man-body">
          <div class="man-kicker">Manual</div>
          <h1>Como escrever prompts que a IA entende</h1>
          <p class="man-lead">Um bom prompt é como uma boa issue: contexto suficiente, objetivo claro e critérios de aceite. O prompte estrutura isso por você — este guia explica o porquê.</p>

          <h2>Anatomia de um prompt</h2>
          <p>Todo template do prompte segue a mesma espinha dorsal. Quando você entende as partes, consegue ajustar o resultado com precisão:</p>
          <ul>
            <li><b>Papel e objetivo</b> — o que a IA deve fazer e em que posição (revisor, arquiteto, SRE).</li>
            <li><b>Contexto</b> — onde o código roda, restrições, o que já foi tentado.</li>
            <li><b>Entrada concreta</b> — o trecho, o arquivo, o repositório — nunca uma suposição.</li>
            <li><b>Formato de saída</b> — diff, lista priorizada, tabela de severidade.</li>
          </ul>
          <div class="man-callout">${ic('i-info')}<div><b>Por que importa:</b> modelos respondem ao que é explícito. Cada parte ausente vira uma suposição do modelo — e suposições são onde a qualidade vaza.</div></div>

          <h2>Os 7 critérios de qualidade</h2>
          <p class="muted">O <code>Assistente de Qualidade</code> avalia cada prompt nestes eixos, ancorados nos guias de prompt da Anthropic e da OpenAI:</p>
          <div class="man-pre"><span class="c"># avaliado ao vivo enquanto você preenche</span>
1. Objetivo e papel definidos
2. Contexto suficiente
3. Entrada concreta (código/repo, não suposição)
4. Formato de saída especificado
5. Restrições e critérios de aceite
6. Anti-ambiguidade (sem "melhor/rápido" sem métrica)
7. Detalhamento adequado</div>

          <h2>Playground</h2>
          <p>Experimente sem sair do manual. Edite e veja a qualidade reagir:</p>
          <div class="man-play">
            <div class="man-play-top">${ic('i-play')} Playground <span class="pe-chip accent"><span class="dot"></span> 82 · Forte</span></div>
            <div class="man-play-body">
              <textarea>Revise auth.ts buscando falhas de segurança no fluxo de verificação de JWT. Contexto: middleware de API pública. Saída: diff + severidade.</textarea>
              <button class="pe-btn" style="align-self:flex-start">${ic('i-bolt')} Gerar</button>
            </div>
          </div>
        </article>
      </div>`,
      after: () => {
        const links = document.querySelectorAll('.man-toc a');
        links.forEach((a) => a.onclick = (e) => { e.preventDefault(); links.forEach((x) => x.classList.remove('on')); a.classList.add('on'); });
      },
    },

    /* ============ NAV MOBILE ============ */
    navmobile: {
      title: 'Navegação mobile', desc: 'Bottom-nav + drawer consistentes',
      note: 'Substitui o hambúrguer+overlay por um padrão único nas 5 telas: bottom-nav fixa + drawer "Mais". Alvos ≥ 44px.',
      html: () => `<div class="navm" id="navm"></div>`,
      after: renderNavMobile,
    },

    /* ============ CHAT ============ */
    chat: {
      title: 'Chat / assistente', desc: 'FAB + painel · 6 estados',
      note: 'Redesenho do assistente. Use o seletor para percorrer os estados: vazio, pensando, resposta, rate-limit, offline, erro.',
      html: () => `<div class="chatscreen">
        <div class="chat-states" id="chatStates">
          <button class="on" data-s="welcome">Boas-vindas</button>
          <button data-s="thinking">Pensando</button>
          <button data-s="answer">Resposta + ebook</button>
          <button data-s="rate">Rate-limit</button>
          <button data-s="offline">Offline</button>
          <button data-s="error">Erro</button>
        </div>
        <div class="chat-stage"><div id="chatPanel" style="width:100%"></div></div>
      </div>`,
      after: renderChat,
    },

    /* ============ DETALHE DO PROMPT ============ */
    'prompt-detail': {
      title: 'Detalhe do prompt', desc: 'Biblioteca · visualizar prompt salvo',
      scroll: true,
      note: 'Tela ausente hoje. Reusa <code>resultPanel.js</code> (ações) e <code>promptQuality.js</code> (chip). Abrir via card da Biblioteca.',
      html: () => `<div class="pd">
        <div class="pd-bar">
          <button class="pd-back">${ic('i-arrow-left')} Biblioteca</button>
          <span class="sp"></span>
          <button class="pd-star on" aria-label="Favorito">${ic('i-star-fill')}</button>
        </div>
        <div class="pd-head">
          <div class="pd-crumb">Domínios avançados <span class="accent">/</span> Cloud / Infra</div>
          <div class="pd-title">Cloud review — main.tf produção</div>
          <div class="pd-tags"><span class="pd-tag">#aws</span><span class="pd-tag">#terraform</span><span class="pd-tag">#lgpd</span></div>
        </div>
        <div class="pd-cols">
          <div class="pd-main">
            <pre class="pd-pre">Analise detalhadamente o repositorio org/infra, com foco em main.tf.

CONTEXTO: provisiona o ambiente de producao (VPC, RDS, EKS).
PROVEDOR DE NUVEM: AWS

DOMINIO: Cloud Computing
Verifique os seguintes aspectos:
1. Seguranca (IAM, criptografia, flags)
2. Infra as Code (Terraform)
3. Compliance (LGPD, NIST, BACEN)

REGRAS OBRIGATORIAS:
- Modelo de responsabilidade compartilhada
- Hardcoding de secrets, chaves ou credenciais
- Backup e disaster recovery

FORMATO DE RESPOSTA:
1. Diagnostico com severidade (critica | alta | media | baixa)
2. Recomendacoes por area
3. Diff completo para cada correcao
4. Roadmap priorizado por impacto</pre>
          </div>
          <aside class="pd-side">
            <div class="pd-meta">
              <div class="row">${ic('i-code')}<span class="k">Template</span><span class="v">Cloud / Infra</span></div>
              <div class="row">${ic('i-folder')}<span class="k">Coleção</span><span class="v">Segurança</span></div>
              <div class="row">${ic('i-clock')}<span class="k">Criado</span><span class="v">há 1 dia</span></div>
              <div class="row">${ic('i-edit')}<span class="k">Editado</span><span class="v">há 3 h</span></div>
            </div>
            <div class="pd-q">
              <div class="pd-q-top"><span class="lab">Qualidade</span><span class="pd-q-score">86 · Forte</span></div>
              <div class="pd-q-list">
                <div class="pd-q-item"><span class="dot ok">${ic('i-check')}</span> Objetivo e papel definidos</div>
                <div class="pd-q-item"><span class="dot ok">${ic('i-check')}</span> Contexto suficiente</div>
                <div class="pd-q-item"><span class="dot ok">${ic('i-check')}</span> Formato de saída especificado</div>
                <div class="pd-q-item"><span class="dot no">!</span> Critérios de aceite mensuráveis</div>
              </div>
            </div>
          </aside>
        </div>
        <div class="pd-actions">
          <button class="pe-btn">${ic('i-copy')} Copiar</button>
          <button class="pe-btn-secondary pe-btn">${ic('i-edit')} Editar</button>
          <button class="pe-btn-secondary pe-btn">${ic('i-external')} Abrir na IA</button>
          <button class="pe-btn-secondary pe-btn">${ic('i-download')} Exportar .md</button>
          <span style="flex:1"></span>
          <button class="pe-btn-secondary pe-btn">${ic('i-folder')} Mover</button>
          <button class="pe-btn-secondary pe-btn" style="color:oklch(0.72 0.16 25)">${ic('i-trash')} Excluir</button>
        </div>
      </div>`,
    },

    /* ============ ONBOARDING ============ */
    onboarding: {
      title: 'Onboarding', desc: 'Primeira execução · 3 passos',
      note: 'Leve e pulável. Persistir conclusão em <code>localStorage</code>. Passo 3 faz deep-link para a “porta”.',
      html: () => `<div class="ob" id="ob"></div>`,
      after: renderOnboarding,
    },

    /* ============ PREFERÊNCIAS ============ */
    prefs: {
      title: 'Preferências', desc: 'Aparência · idioma · dados · conta',
      note: 'Consolida o dropdown <code>buildPreferencesMenu</code> numa tela. Acento não-fixo (token <code>--accent</code>).',
      html: () => `<div class="pref">
        <nav class="pref-nav" id="prefNav">
          <button class="pref-nav-item on" data-tab="ap">${ic('i-palette')} Aparência</button>
          <button class="pref-nav-item" data-tab="idi">${ic('i-globe')} Idioma</button>
          <button class="pref-nav-item" data-tab="dad">${ic('i-database')} Dados</button>
          <button class="pref-nav-item" data-tab="con">${ic('i-user')} Conta</button>
        </nav>
        <div class="pref-panel" id="prefPanel"></div>
      </div>`,
      after: renderPrefs,
    },

    /* ============ ADMIN ============ */
    admin: {
      title: 'Admin · dashboard', desc: 'Métricas de telemetria',
      scroll: true,
      note: 'Hoje usa <code>&lt;style&gt;</code> inline. Migrar para o sistema: KPIs + gráficos CSS/SVG + tabela.',
      html: () => `<div class="adm">
        <div class="adm-head">
          <div><h2>Painel de métricas</h2><p>Telemetria anônima · atualizado há 4 min</p></div>
          <div class="adm-range"><button>24h</button><button class="on">7 dias</button><button>30 dias</button></div>
        </div>
        <div class="adm-kpis">
          <div class="kpi"><div class="kpi-top"><span class="k">Prompts gerados</span>${ic('i-bolt')}</div><div class="kpi-val">3.482</div><div class="kpi-delta up">${ic('i-trending')} +18%</div></div>
          <div class="kpi"><div class="kpi-top"><span class="k">Usuários ativos</span>${ic('i-users')}</div><div class="kpi-val">612</div><div class="kpi-delta up">${ic('i-trending')} +9%</div></div>
          <div class="kpi"><div class="kpi-top"><span class="k">Qualidade média</span>${ic('i-gauge')}</div><div class="kpi-val">74</div><div class="kpi-delta up">${ic('i-trending')} +5</div></div>
          <div class="kpi"><div class="kpi-top"><span class="k">Salvos / gerados</span>${ic('i-library')}</div><div class="kpi-val">38%</div><div class="kpi-delta down">${ic('i-trending')} −2%</div></div>
        </div>
        <div class="adm-grid">
          <div class="adm-card">
            <h3>Geração por dia <span class="sub">últimos 7 dias</span></h3>
            <div class="bars">${[52, 64, 48, 80, 96, 72, 88].map((h, i) => `
              <div class="bar-col ${i === 6 ? '' : ''}"><div class="bar" style="height:${h}%"></div><span class="bar-lab">${['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i]}</span></div>`).join('')}</div>
          </div>
          <div class="adm-card">
            <h3>Por categoria</h3>
            <div class="donut-wrap">
              <svg class="donut" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--bg-3)" stroke-width="6"/>
                <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--accent)" stroke-width="6" stroke-dasharray="42 58" stroke-dashoffset="25" transform="rotate(-90 21 21)"/>
                <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--accent-line)" stroke-width="6" stroke-dasharray="28 72" stroke-dashoffset="-17" transform="rotate(-90 21 21)"/>
                <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--line-2)" stroke-width="6" stroke-dasharray="18 82" stroke-dashoffset="-45" transform="rotate(-90 21 21)"/>
              </svg>
              <div class="legend">
                <div class="legend-item"><span class="sw-dot" style="background:var(--accent)"></span> Código direto <span class="lv">42%</span></div>
                <div class="legend-item"><span class="sw-dot" style="background:var(--accent-line)"></span> Domínios <span class="lv">28%</span></div>
                <div class="legend-item"><span class="sw-dot" style="background:var(--line-2)"></span> Diff <span class="lv">18%</span></div>
                <div class="legend-item"><span class="sw-dot" style="background:var(--bg-3)"></span> Repo <span class="lv">12%</span></div>
              </div>
            </div>
          </div>
        </div>
        <div class="adm-card">
          <h3>Eventos recentes</h3>
          <table class="adm-table">
            <thead><tr><th>Quando</th><th>Evento</th><th>Template</th><th>Qualidade</th></tr></thead>
            <tbody>
              <tr><td class="mono">12:41</td><td>prompt.generated</td><td>Cloud / Infra</td><td class="ok">86</td></tr>
              <tr><td class="mono">12:39</td><td>prompt.saved</td><td>Revisão e correção</td><td class="ok">78</td></tr>
              <tr><td class="mono">12:36</td><td>prompt.generated</td><td>Debug de erros</td><td>61</td></tr>
              <tr><td class="mono">12:30</td><td>prompt.copied</td><td>IA / Machine Learning</td><td class="ok">90</td></tr>
              <tr><td class="mono">12:22</td><td>prompt.generated</td><td>Métricas / OKR</td><td>69</td></tr>
            </tbody>
          </table>
        </div>
      </div>`,
    },

    /* ============ AUTH ============ */
    'auth-out': {
      title: 'Entrar', desc: 'Conta / Perfil · estado deslogado',
      note: 'Magic link via Supabase. Reusa <code>.pe-modal</code> hoje — aqui vira superfície dedicada. CTA = <code>.pe-btn</code>.',
      html: () => `<div class="center"><div class="auth-card pe-card">
        <div class="ttl">Entrar no prompte</div>
        <p class="desc">Use seu e-mail. Enviamos um link mágico — sem senha para lembrar.</p>
        <div class="pe-field">
          <label class="pe-label" for="em">E-mail</label>
          <input class="pe-input" id="em" type="email" placeholder="voce@empresa.com" value="dev@time.io" />
        </div>
        <button class="pe-btn pe-btn-block" style="margin-top:18px">${ic('i-mail')} Enviar link de acesso</button>
        <div class="auth-divider">ou</div>
        <button class="pe-btn-secondary pe-btn pe-btn-block">${ic('i-bolt')} Continuar sem conta</button>
        <p class="auth-note">${ic('i-info')} Sem conta você gera até <b>5 prompts/dia</b> e fica só neste dispositivo. Com conta, sincroniza a biblioteca.</p>
      </div></div>`,
    },
    'auth-sent': {
      title: 'Link enviado', desc: 'Conta / Perfil · cheque seu e-mail',
      note: 'Estado pós-envio. Botão "Reenviar" desabilitado com countdown (<code>aria-live</code>).',
      html: () => `<div class="center">
        <div class="glyph">${ic('i-mail')}</div>
        <h2>Cheque seu e-mail</h2>
        <p class="sub">Enviamos um link de acesso para <b>dev@time.io</b>. Abra no mesmo navegador para entrar.</p>
        <div class="acts">
          <button class="pe-btn-secondary pe-btn" id="resendBtn">${ic('i-refresh')} Reenviar em <span id="cd">28</span>s</button>
          <button class="pe-btn-ghost pe-btn">Trocar e-mail</button>
        </div>
        <p class="meta">Não chegou? Veja o spam ou <a href="#">use outro e-mail</a>.</p>
      </div>`,
    },
    'auth-verify': {
      title: 'Verificando', desc: 'Conta / Perfil · retorno do link',
      note: 'Tela transitória ao voltar do e-mail (token na URL). Sucesso → Logado; falha → Sessão expirada.',
      html: () => `<div class="center">
        <div class="glyph"><span class="pe-spinner lg"></span></div>
        <h2>Verificando seu acesso…</h2>
        <p class="sub">Confirmando o link com segurança. Isso leva um instante.</p>
      </div>`,
    },
    'auth-in': {
      title: 'Logado', desc: 'Conta / Perfil · sessão ativa',
      note: 'Perfil consolidado: identidade, limite de uso, dados e sair. Reusa <code>.pe-btn-danger</code>.',
      html: () => `<div class="center"><div class="prof pe-card">
        <div class="prof-id">
          <div class="prof-av">D</div>
          <div class="who"><b>dev@time.io</b><span>Conta verificada · entrou há 3 dias</span></div>
        </div>
        <div class="prof-rows">
          <div class="prof-row">${ic('i-bolt')}<span class="k">Uso hoje</span><span class="usage-bar"><i style="width:46%"></i></span></div>
          <div class="prof-row">${ic('i-shield')}<span class="k">Plano</span><span class="v accent">Autenticado · ilimitado</span></div>
          <div class="prof-row">${ic('i-library')}<span class="k">Prompts salvos</span><span class="v">24</span></div>
          <div class="prof-row">${ic('i-refresh')}<span class="k">Sincronização</span><span class="v">há 2 min</span></div>
        </div>
        <div class="prof-foot" style="display:flex;gap:10px">
          <button class="pe-btn-secondary pe-btn" style="flex:1">Exportar dados</button>
          <button class="pe-btn-danger pe-btn" style="flex:1">${ic('i-logout')} Sair</button>
        </div>
      </div></div>`,
    },
    'auth-expired': {
      title: 'Sessão expirada', desc: 'Conta / Perfil · re-login',
      note: 'Disparada por 401 após token expirar. Preserva o contexto: volta para onde estava após entrar.',
      html: () => `<div class="center">
        <div class="glyph danger">${ic('i-shield')}</div>
        <h2>Sua sessão expirou</h2>
        <p class="sub">Por segurança, encerramos a sessão após um período inativo. Entre de novo para continuar — <b>seu trabalho não foi perdido</b>.</p>
        <div class="acts"><button class="pe-btn">${ic('i-mail')} Entrar novamente</button>
          <button class="pe-btn-ghost pe-btn">Continuar sem conta</button></div>
      </div>`,
    },

    /* ============ ESTADOS ============ */
    'st-empty': {
      title: 'Empty state', desc: 'Kit de estados · biblioteca vazia',
      note: 'Padrão único de vazio para biblioteca, histórico e coleções. Sempre com 1 ação primária.',
      html: () => libTop('Biblioteca', '0 prompts salvos') + `<div class="fr-pad" style="padding-top:8px">
        <div class="state-empty">
          <div class="glyph">${ic('i-library')}</div>
          <h3>Sua biblioteca está vazia</h3>
          <p>Gere um prompt e toque em “Salvar” para guardá-lo aqui — organizado por coleção e tags.</p>
          <button class="pe-btn">${ic('i-bolt')} Gerar meu primeiro prompt</button>
        </div></div>`,
    },
    'st-loading': {
      title: 'Loading (skeleton)', desc: 'Kit de estados · carregando conteúdo',
      note: 'Skeleton espelha o layout final do card (não “Carregando…”). Respeita <code>prefers-reduced-motion</code>.',
      html: () => libTop('Biblioteca', 'Carregando…') + `<div class="fr-pad" style="padding-top:8px">
        <div class="sk-grid">${Array.from({ length: 6 }).map(() => `
          <div class="sk-card">
            <div class="sk-top"><span class="sk sk-chip"></span><span class="sk sk-star"></span></div>
            <div class="sk sk-line w70"></div>
            <div class="sk sk-line w90"></div>
            <div class="sk sk-line w55"></div>
            <div style="margin-top:14px"><span class="sk sk-pill"></span><span class="sk sk-pill"></span></div>
          </div>`).join('')}</div></div>`,
    },
    'st-error': {
      title: 'Erro + retry', desc: 'Kit de estados · falha genérica',
      note: 'Erro recuperável: mensagem honesta + ação de retry. Detalhe técnico colapsado para o dev.',
      html: () => `<div class="center">
        <div class="glyph danger">${ic('i-x-circle')}</div>
        <h2>Algo deu errado ao carregar</h2>
        <p class="sub">Não conseguimos buscar seus prompts agora. Isso costuma ser temporário.</p>
        <div class="acts"><button class="pe-btn">${ic('i-refresh')} Tentar de novo</button>
          <button class="pe-btn-ghost pe-btn">Voltar ao início</button></div>
        <p class="meta">Código: <code style="font-family:var(--font-mono)">ERR_FETCH_LIB</code></p>
      </div>`,
    },
    'st-404': {
      title: '404 / rota inválida', desc: 'Kit de estados · página não encontrada',
      note: 'Rota inexistente ou deep-link quebrado (<code>#t=&lt;template&gt;</code> inválido). Oferece os caminhos principais.',
      html: () => `<div class="center">
        <div class="glyph muted">${ic('i-compass')}</div>
        <h2 style="font-family:var(--font-mono);font-size:40px">404</h2>
        <p class="sub">Esta página não existe ou o link expirou. Vamos te recolocar no caminho.</p>
        <div class="acts">
          <button class="pe-btn">${ic('i-home')} Início</button>
          <button class="pe-btn-secondary pe-btn">${ic('i-bolt')} Gerador</button>
          <button class="pe-btn-secondary pe-btn">${ic('i-library')} Biblioteca</button>
        </div>
      </div>`,
    },
    'st-offline': {
      title: 'Offline', desc: 'Kit de estados · sem conexão',
      note: 'Offline-first honesto: geração por templates continua; só recursos de rede (IA/sync) ficam indisponíveis.',
      html: () => `<div class="fr-pad" style="gap:18px">
        <div class="pe-banner warn">${ic('i-wifi-off')}<div><b>Você está offline.</b> A geração de prompts por template continua funcionando — chat com IA e sincronização voltam quando a conexão voltar.</div></div>
        <div class="center" style="padding:36px 24px">
          <div class="glyph muted">${ic('i-wifi-off')}</div>
          <h2>Sem conexão</h2>
          <p class="sub">O que precisa de rede está pausado. Suas ações offline ficam na fila e sincronizam sozinhas ao reconectar.</p>
          <div class="acts"><button class="pe-btn-secondary pe-btn">${ic('i-refresh')} Verificar conexão</button>
            <button class="pe-btn">${ic('i-bolt')} Gerar offline</button></div>
        </div></div>`,
    },
    'st-rate': {
      title: 'Rate limit (429)', desc: 'Kit de estados · limite atingido',
      note: 'Padroniza o 429 (hoje só no chat) com countdown. Anel + número regressivo, <code>aria-live="polite"</code>.',
      html: () => `<div class="center">
        <div class="rl-ring" role="timer" aria-live="polite">
          <svg width="96" height="96"><circle cx="48" cy="48" r="42" fill="none" stroke="var(--bg-3)" stroke-width="6"/>
            <circle id="rlArc" cx="48" cy="48" r="42" fill="none" stroke="var(--accent)" stroke-width="6" stroke-linecap="round" stroke-dasharray="264" stroke-dashoffset="0"/></svg>
          <span class="num" id="rlNum">24</span>
        </div>
        <h2 style="margin-top:22px">Limite de uso atingido</h2>
        <p class="sub">Você fez muitas solicitações em sequência. Aguarde o contador para continuar — ou <b>entre</b> para um limite maior.</p>
        <div class="acts"><button class="pe-btn-secondary pe-btn" id="rlBtn" disabled>Aguarde <span id="rlBtnNum">24</span>s</button>
          <button class="pe-btn">${ic('i-mail')} Entrar para ampliar</button></div>
      </div>`,
    },
    'st-toasts': {
      title: 'Toasts', desc: 'Kit de estados · feedback transitório',
      note: 'Três variantes únicas: success / error / info. Reusa <code>.pe-toast</code>.',
      html: () => `<div class="fr-pad"><div class="state-empty" style="justify-content:flex-start;padding-top:40px">
        <div class="toast-row">
          <div class="pe-toast success">${ic('i-check')} Prompt salvo na biblioteca</div>
          <div class="pe-toast error">${ic('i-alert')} Não foi possível copiar — tente de novo</div>
          <div class="pe-toast info">${ic('i-info')} Você está no modo offline</div>
        </div>
      </div></div>`,
    },
  };

  const frBody = document.getElementById('frBody');
  const frame = document.querySelector('.frame');
  const cTitle = document.getElementById('cTitle');
  const cDesc = document.getElementById('cDesc');
  let timers = [];
  const clearTimers = () => { timers.forEach((t) => clearInterval(t)); timers = []; };

  /* ---- onboarding (multi-passo) ---- */
  const ACCENTS = [['#c9f24d', 'lime'], ['#fbbf45', 'amber'], ['#ff8264', 'coral'], ['#c9a6ff', 'violet'], ['#6fe3d2', 'teal']];
  let obStep = 0, obTheme = 'dark', obLang = 'pt', obAccent = '#c9f24d';
  function renderOnboarding() {
    const el = document.getElementById('ob'); if (!el) return;
    const dots = `<div class="ob-dots">${[0, 1, 2].map((i) => `<span class="ob-dot ${i === obStep ? 'on' : i < obStep ? 'done' : ''}"></span>`).join('')}</div>`;
    let body = '';
    if (obStep === 0) {
      body = `<div class="ob-illus">${ic('i-bolt')}</div>
        <h2>Bem-vindo ao prompte</h2>
        <p>Gere prompts de engenharia de software de alta qualidade a partir de 25 templates — com análise de qualidade embutida.</p>
        <div class="ob-doors">
          <div class="ob-door"><span class="di">${ic('i-code')}</span><div><b>Código</b><span>Revisar, corrigir, criar</span></div></div>
          <div class="ob-door"><span class="di">${ic('i-database')}</span><div><b>Repositório</b><span>Análise estruturada</span></div></div>
          <div class="ob-door"><span class="di">${ic('i-edit')}</span><div><b>Diff</b><span>Patches prontos</span></div></div>
          <div class="ob-door"><span class="di">${ic('i-gauge')}</span><div><b>Domínios</b><span>Lentes de especialista</span></div></div>
        </div>`;
    } else if (obStep === 1) {
      body = `<div class="ob-illus">${ic('i-palette')}</div>
        <h2>Deixe do seu jeito</h2>
        <p>Ajuste agora — dá para mudar depois em Preferências.</p>
        <div class="ob-choices">
          <div><span class="ob-choice-lab">Tema</span><div class="ob-seg" id="obTheme">
            <button data-v="light" class="${obTheme === 'light' ? 'on' : ''}">${ic('i-sun')} Claro</button>
            <button data-v="dark" class="${obTheme === 'dark' ? 'on' : ''}">${ic('i-moon')} Escuro</button></div></div>
          <div><span class="ob-choice-lab">Idioma</span><div class="ob-seg" id="obLang">
            <button data-v="pt" class="${obLang === 'pt' ? 'on' : ''}">Português</button>
            <button data-v="en" class="${obLang === 'en' ? 'on' : ''}">English</button></div></div>
          <div><span class="ob-choice-lab">Cor de destaque</span><div class="sw-row" id="obAccent">
            ${ACCENTS.map(([c]) => `<span class="sw ${obAccent === c ? 'on' : ''}" data-c="${c}" style="background:${c}">${ic('i-check')}</span>`).join('')}</div></div>
        </div>`;
    } else {
      body = `<div class="ob-illus">${ic('i-arrow-right')}</div>
        <h2>Por onde começar?</h2>
        <p>Escolha um ponto de partida — leva direto ao gerador com o template certo.</p>
        <div class="ob-doors">
          <div class="ob-door"><span class="di">${ic('i-code')}</span><div><b>Revisar um trecho</b><span>Cole código e gere</span></div></div>
          <div class="ob-door"><span class="di">${ic('i-database')}</span><div><b>Analisar um repo</b><span>Varredura completa</span></div></div>
        </div>`;
    }
    el.innerHTML = `<div class="ob-card">${dots}${body}
      <div class="ob-foot">
        <button class="ob-skip">${obStep < 2 ? 'Pular' : ''}</button>
        <button class="pe-btn" id="obNext">${obStep < 2 ? 'Continuar' : 'Começar a usar'} ${ic('i-arrow-right')}</button>
      </div></div>`;
    el.querySelector('#obNext').onclick = () => { if (obStep < 2) { obStep++; renderOnboarding(); } };
    el.querySelector('.ob-skip').onclick = () => { obStep = 0; render('prompt-detail'); setActive('prompt-detail'); };
    const seg = (id, set) => { const w = el.querySelector('#' + id); if (w) w.querySelectorAll('button').forEach((b) => b.onclick = () => { set(b.dataset.v); renderOnboarding(); }); };
    seg('obTheme', (v) => { obTheme = v; document.documentElement.classList.toggle('theme-light', v === 'light'); });
    seg('obLang', (v) => obLang = v);
    const acc = el.querySelector('#obAccent');
    if (acc) acc.querySelectorAll('.sw').forEach((s) => s.onclick = () => { obAccent = s.dataset.c; document.documentElement.style.setProperty('--accent', s.dataset.c); renderOnboarding(); });
  }

  /* ---- preferências (abas) ---- */
  let prefAccent = '#c9f24d', prefDensity = 'conf', prefReduce = false;
  const PREF_TABS = {
    ap: () => `<div class="pref-h">Aparência</div><p class="pref-hint">Tema, cor de destaque e densidade.</p>
      <div class="pref-group"><div class="pref-row"><div class="lab"><b>Tema</b><span>Claro, escuro ou conforme o sistema</span></div>
        <div class="ctl"><div class="pref-seg" id="pTheme"><button data-v="light">${ic('i-sun')} Claro</button><button data-v="dark" class="on">${ic('i-moon')} Escuro</button><button data-v="sys">Auto</button></div></div></div></div>
      <div class="pref-group"><div class="pref-row"><div class="lab"><b>Cor de destaque</b><span>Aplicada em toda a interface</span></div>
        <div class="ctl"><div class="sw-row" id="pAccent">${ACCENTS.map(([c]) => `<span class="sw ${prefAccent === c ? 'on' : ''}" data-c="${c}" style="background:${c}">${ic('i-check')}</span>`).join('')}</div></div></div></div>
      <div class="pref-group"><div class="pref-row"><div class="lab"><b>Densidade</b><span>Espaçamento da interface</span></div>
        <div class="ctl"><div class="pref-seg" id="pDens"><button data-v="comp">Compacto</button><button data-v="conf" class="on">Confortável</button></div></div></div>
        <div class="pref-row"><div class="lab"><b>Menos movimento</b><span>Reduz animações e transições</span></div>
        <div class="ctl"><div class="pe-switch" id="pReduce"><i></i></div></div></div></div>`,
    idi: () => `<div class="pref-h">Idioma</div><p class="pref-hint">Idioma da interface e dos templates.</p>
      <div class="pref-group"><div class="pref-row"><div class="lab"><b>Idioma</b><span>pt-BR completo · en disponível</span></div>
        <div class="ctl"><div class="pref-seg"><button class="on">Português</button><button>English</button></div></div></div>
        <div class="pref-row"><div class="lab"><b>Formato de datas</b><span>No painel de métricas</span></div>
        <div class="ctl"><div class="pref-seg"><button class="on">DD/MM</button><button>MM/DD</button></div></div></div></div>`,
    dad: () => `<div class="pref-h">Dados</div><p class="pref-hint">Sua biblioteca fica neste dispositivo (e sincroniza se você tiver conta).</p>
      <div class="pref-group"><div class="pref-row"><div class="lab"><b>Exportar biblioteca</b><span>Baixa um .json com prompts e coleções</span></div>
        <div class="ctl"><button class="pe-btn-secondary pe-btn">${ic('i-download')} Exportar</button></div></div>
        <div class="pref-row"><div class="lab"><b>Importar</b><span>Restaura de um arquivo exportado</span></div>
        <div class="ctl"><button class="pe-btn-secondary pe-btn">${ic('i-upload')} Importar</button></div></div></div>
      <div class="pref-group"><div class="pref-row"><div class="lab"><b>Limpar dados locais</b><span>Remove tudo deste dispositivo · irreversível</span></div>
        <div class="ctl"><button class="pe-btn-secondary pe-btn" style="color:oklch(0.72 0.16 25)">${ic('i-trash')} Limpar</button></div></div></div>`,
    con: () => `<div class="pref-h">Conta</div><p class="pref-hint">Sessão e sincronização.</p>
      <div class="pref-group"><div class="pref-row"><div class="lab"><b>E-mail</b><span>Conta verificada</span></div><div class="ctl" style="font-weight:600">dev@time.io</div></div>
        <div class="pref-row"><div class="lab"><b>Sincronização</b><span>Última: há 2 min</span></div><div class="ctl"><span class="pe-chip accent"><span class="dot"></span> ativa</span></div></div></div>
      <div class="pref-group"><div class="pref-row"><div class="lab"><b>Sair da conta</b><span>Encerra a sessão neste dispositivo</span></div>
        <div class="ctl"><button class="pe-btn-danger pe-btn">${ic('i-logout')} Sair</button></div></div></div>`,
  };
  function renderPrefs() {
    const nav = document.getElementById('prefNav'); const panel = document.getElementById('prefPanel');
    if (!nav || !panel) return;
    const draw = (tab) => {
      panel.innerHTML = PREF_TABS[tab]();
      const pa = panel.querySelector('#pAccent');
      if (pa) pa.querySelectorAll('.sw').forEach((s) => s.onclick = () => { prefAccent = s.dataset.c; document.documentElement.style.setProperty('--accent', s.dataset.c); draw('ap'); });
      const pt = panel.querySelector('#pTheme');
      if (pt) pt.querySelectorAll('button').forEach((b) => b.onclick = () => { pt.querySelectorAll('button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); if (b.dataset.v !== 'sys') document.documentElement.classList.toggle('theme-light', b.dataset.v === 'light'); });
      const pd = panel.querySelector('#pDens');
      if (pd) pd.querySelectorAll('button').forEach((b) => b.onclick = () => { pd.querySelectorAll('button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); });
      const pr = panel.querySelector('#pReduce');
      if (pr) pr.onclick = () => pr.classList.toggle('on');
    };
    nav.querySelectorAll('.pref-nav-item').forEach((b) => b.onclick = () => { nav.querySelectorAll('.pref-nav-item').forEach((x) => x.classList.remove('on')); b.classList.add('on'); draw(b.dataset.tab); });
    draw('ap');
  }

  /* ---- nav mobile (bottom-nav + drawer) ---- */
  let drawerOpen = false;
  function renderNavMobile() {
    const el = document.getElementById('navm'); if (!el) return;
    const bnav = (active) => `<div class="mnav">
      <button class="mnav-item ${active === 'home' ? 'on' : ''}">${ic('i-home')} Início</button>
      <button class="mnav-item ${active === 'lib' ? 'on' : ''}">${ic('i-library')} Biblioteca</button>
      <button class="mnav-item cta">${ic('i-bolt')} Gerar</button>
      <button class="mnav-item ${active === 'man' ? 'on' : ''}">${ic('i-book')} Manual</button>
      <button class="mnav-item" id="moreBtn">${ic('i-menu')} Mais</button>
    </div>`;
    el.innerHTML = `
      <div class="phone">
        <div class="phone-status"><span>9:41</span><span>${ic('i-bolt')}</span></div>
        <div class="phone-top"><span class="mk">p</span><b>Biblioteca</b><button class="pe-icon-btn">${ic('i-search')}</button></div>
        <div class="phone-body">
          <div class="phone-h">Biblioteca</div><div class="phone-sub">6 prompts salvos</div>
          <div class="phone-card"><div class="t">Cloud review — main.tf</div><div class="s">Domínios · há 1 dia</div></div>
          <div class="phone-card"><div class="t">Auditoria de auth.ts</div><div class="s">Código direto · há 2 h</div></div>
          <div class="phone-card"><div class="t">Refactor do Button</div><div class="s">Diff · há 2 dias</div></div>
          ${drawerOpen ? `<div class="drawer-mask" id="mask"><div class="drawer">
            <div class="drawer-grip"></div>
            <div class="drawer-item on">${ic('i-library')} Biblioteca</div>
            <div class="drawer-item">${ic('i-gauge')} Métricas</div>
            <div class="drawer-item">${ic('i-sliders')} Preferências</div>
            <div class="drawer-item">${ic('i-user')} Conta</div>
            <div class="drawer-item">${ic('i-message')} Assistente</div>
          </div></div>` : ''}
        </div>
        ${bnav('lib')}
      </div>
      <div class="phone">
        <div class="phone-status"><span>9:41</span><span></span></div>
        <div class="phone-top"><span class="mk">p</span><b>Início</b><button class="pe-icon-btn">${ic('i-search')}</button></div>
        <div class="phone-body">
          <div class="phone-h">O que a IA faz<br>com seu código?</div><div class="phone-sub" style="margin-top:6px">Escolha um ponto de partida</div>
          <div class="phone-card"><div class="t">Revisar um trecho</div><div class="s">Cole código e gere</div></div>
          <div class="phone-card"><div class="t">Analisar um repo</div><div class="s">Varredura completa</div></div>
        </div>
        ${bnav('home')}
      </div>
      <div class="navm-label">Bottom-nav fixa (4 destinos + “Gerar” em destaque) · “Mais” abre o drawer — toque em “Mais” no card da esquerda</div>`;
    const more = el.querySelector('#moreBtn');
    if (more) more.onclick = () => { drawerOpen = !drawerOpen; renderNavMobile(); };
    const mask = el.querySelector('#mask');
    if (mask) mask.onclick = (e) => { if (e.target === mask) { drawerOpen = false; renderNavMobile(); } };
  }

  /* ---- chat (6 estados) ---- */
  let chatState = 'welcome';
  const CHAT = {
    welcome: () => `<div class="chat-empty">
      <div class="av-lg">${ic('i-sparkle')}</div>
      <h3>Assistente do prompte</h3>
      <p>Tire dúvidas sobre engenharia de prompt ou peça ajuda para refinar o seu.</p>
      <div class="chat-sugg">
        <button>${ic('i-bolt')} Como deixo este prompt mais específico?</button>
        <button>${ic('i-gauge')} O que significa o score de qualidade?</button>
        <button>${ic('i-book')} Quando uso o modo Avançado?</button>
      </div></div>`,
    thinking: () => `<div class="chat-body">
      <div class="msg me">Como melhoro o prompt de Cloud review?</div>
      <div class="msg bot"><span class="typing"><i></i><i></i><i></i></span></div>
    </div>`,
    answer: () => `<div class="chat-body">
      <div class="msg me">Como melhoro o prompt de Cloud review?</div>
      <div class="msg bot">Adicione <b>critérios de aceite mensuráveis</b> — ex.: “sinalize qualquer recurso sem criptografia em repouso” — e cite o provedor. Isso sobe o eixo 5 (restrições) do score.</div>
      <div class="chat-ebook"><div class="cover"></div><div><div class="t">Cloud Security — práticas</div><div class="s">Ebook analisado · cap. 3 cobre IAM e secrets</div><a class="lnk">Abrir referência →</a></div></div>
    </div>`,
    rate: () => `<div class="chat-body">
      <div class="msg me">Mais uma análise, por favor</div>
    </div><div class="chat-banner warn">${ic('i-clock')}<div><b>Limite atingido.</b> Aguarde <b>18s</b> para enviar de novo, ou entre para um limite maior.</div></div>`,
    offline: () => `<div class="chat-empty">
      <div class="av-lg" style="background:var(--bg-3);color:var(--text-3)">${ic('i-wifi-off')}</div>
      <h3>Assistente offline</h3>
      <p>O chat precisa de conexão. A geração de prompts por template continua funcionando.</p>
    </div>`,
    error: () => `<div class="chat-body">
      <div class="msg me">Explica o critério de anti-ambiguidade</div>
    </div><div class="chat-banner danger">${ic('i-alert')}<div><b>Não consegui responder.</b> Algo falhou no servidor. <a style="color:inherit;text-decoration:underline">Tentar de novo</a>.</div></div>`,
  };
  function renderChat() {
    const panel = document.getElementById('chatPanel'); if (!panel) return;
    const disabled = (chatState === 'offline' || chatState === 'rate') ? 'disabled' : '';
    const status = chatState === 'thinking' ? 'pensando…' : chatState === 'offline' ? 'offline' : 'online';
    panel.innerHTML = `<div class="chat-panel">
      <div class="chat-hd"><span class="av">${ic('i-sparkle')}</span><b>Assistente</b>
        <span class="st">${chatState === 'offline' ? '' : '<span class="dot"></span>'} ${status}</span>
        <button class="pe-icon-btn" style="width:30px;height:30px">${ic('i-x')}</button></div>
      ${CHAT[chatState]()}
      <div class="chat-foot">
        <input placeholder="${disabled ? 'Indisponível agora…' : 'Pergunte algo…'}" ${disabled} />
        <button class="chat-send" ${disabled}>${ic('i-send')}</button>
      </div>
    </div>`;
    const st = document.getElementById('chatStates');
    st.querySelectorAll('button').forEach((b) => b.onclick = () => {
      st.querySelectorAll('button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on'); chatState = b.dataset.s; renderChat();
    });
  }

  function setActive(key) {
    document.querySelectorAll('.idx-item').forEach((x) => x.classList.toggle('on', x.dataset.screen === key));
  }

  function render(key) {
    const s = SCREENS[key]; if (!s) return;
    clearTimers();
    cTitle.textContent = s.title;
    cDesc.textContent = s.desc;
    frame.classList.toggle('scroll', !!s.scroll);
    frBody.innerHTML = s.html() + (s.note ? `<div class="fr-note">${ic('i-info')}<div>${s.note}</div></div>` : '');
    if (s.after) s.after();
  }

  // interações vivas por tela
  SCREENS['auth-sent'].after = () => {
    const cd = document.getElementById('cd'); const btn = document.getElementById('resendBtn');
    btn.disabled = true; let n = 28;
    timers.push(setInterval(() => {
      n--; if (n <= 0) { cd.parentElement.innerHTML = '↻ Reenviar link'; btn.disabled = false; clearTimers(); return; }
      cd.textContent = n;
    }, 1000));
  };
  SCREENS['st-rate'].after = () => {
    const num = document.getElementById('rlNum'); const arc = document.getElementById('rlArc');
    const bn = document.getElementById('rlBtnNum'); const btn = document.getElementById('rlBtn');
    let n = 24; const total = 24; const C = 264;
    timers.push(setInterval(() => {
      n--; if (n < 0) { num.textContent = '✓'; btn.disabled = false; btn.textContent = 'Continuar'; arc.style.strokeDashoffset = C; clearTimers(); return; }
      num.textContent = n; bn.textContent = n; arc.style.strokeDashoffset = C * (1 - n / total);
    }, 1000));
  };

  // navegação
  document.querySelectorAll('.idx-item').forEach((b) => {
    b.addEventListener('click', () => {
      setActive(b.dataset.screen);
      render(b.dataset.screen);
    });
  });

  // device toggle
  const stage = document.getElementById('stage');
  document.querySelectorAll('#device button').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#device button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      stage.classList.toggle('is-mobile', b.dataset.dev === 'mobile');
    });
  });

  // theme toggle
  const themeBtn = document.getElementById('themeBtn');
  themeBtn.addEventListener('click', () => {
    const light = document.documentElement.classList.toggle('theme-light');
    themeBtn.innerHTML = light ? '<svg class="ic"><use href="#i-moon"/></svg>' : '<svg class="ic"><use href="#i-sun"/></svg>';
  });

  render('auth-out');
})();
