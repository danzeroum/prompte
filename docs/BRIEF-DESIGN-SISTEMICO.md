# Brief de Design Sistêmico — Prompt Engineering Pro

> Para o(a) designer. Objetivo: **desenhar telas sistêmicas novas** e **redesenhar as atuais
> onde necessário**, mantendo um sistema coeso (não telas soltas). Este brief está ancorado no
> código real — nomes de tokens, classes `.pe-*` e arquivos — para que o design seja
> diretamente implementável no stack atual (Vite + CSS vanilla com design tokens, sem framework
> de UI).

---

## 1. Contexto do produto

App web (PWA, offline-first) que ajuda pessoas a **gerar prompts de engenharia de software de
alta qualidade** a partir de 25 templates, com análise de qualidade do prompt, biblioteca de
prompts salvos, assistente de chat (LLM) e um manual. Backend é Supabase (auth por magic link,
telemetria, cache, Edge Functions de LLM). Há 2 idiomas (pt/en) e 2 temas (claro/escuro).

**Públicos:** desenvolvedores e times técnicos (iniciante → avançado). **Tom:** técnico,
direto, confiável, sem infantilizar.

**Telas atuais (5):** `index.html` (Home/Análise), `generator.html` (Gerador — 25 templates),
`manual.html` (Manual), `library.html` (Biblioteca), `admin.html` (Métricas).

---

## 2. Princípios de design (norteadores)

1. **Sistêmico antes de telas.** Tudo nasce de tokens + componentes reutilizáveis. Uma mudança
   de token deve propagar para todas as telas. Nada de one-offs visuais.
2. **Foco na tarefa.** O fluxo central é *escolher template → preencher → gerar → usar o
   resultado*. Cada tela deve reduzir fricção nesse caminho.
3. **Estado sempre visível.** Todo componente tem estados (vazio, carregando, erro, offline,
   sucesso, desabilitado, foco). Design não é só o "happy path".
4. **Offline-first honesto.** A geração por templates funciona sem backend; o design deve
   comunicar com clareza o que está indisponível sem bloquear o que funciona.
5. **Acessível por padrão.** WCAG 2.1 AA mínimo: contraste, foco visível, navegação por teclado,
   `prefers-reduced-motion`, alvos de toque ≥ 44px.
6. **Bilíngue por construção.** Layouts toleram o texto crescer/encolher (en costuma ser ~15–30%
   mais curto/longo que pt). Nada de largura fixa dependente de string.
7. **Densidade calibrada.** É uma ferramenta, não uma landing page: priorizar leitura e ação,
   com respiro suficiente. Mobile é primeira-classe.

---

## 3. Auditoria do design system atual

O sistema já é maduro e **deve ser preservado e evoluído**, não substituído.

### Forças (manter)
- **Tokens centralizados** em `assets/css/tokens.css` (cor em **oklch**, tipografia fluida com
  `clamp()`, escala de espaçamento 4px, raios, sombras, z-index, motion).
- **Tipografia:** Space Grotesk (display/UI) + JetBrains Mono (prompts/código), self-hosted.
- **Acento** lime `oklch(0.86 0.185 128)` com paleta alternativa curada (amber, coral, violet,
  teal) — já preparado para temas de acento.
- **Temas claro/escuro** via classe `.light-theme` + `prefers-color-scheme` (`assets/js/theme.js`).
- **Componentes compartilhados** em `assets/css/theme.css`: `.pe-btn`, `.pe-btn-secondary`,
  `.pe-icon-btn`, `.pe-modal`, `.pe-toast`, `.pe-chat-*`, command palette, glossário inline,
  banner offline.
- **Acessibilidade** já presente: `:focus-visible`, `prefers-reduced-motion`, `trapFocus`,
  `aria-*`.

### Dívidas / inconsistências a resolver no redesign
- **Dois esquemas de nomes de token convivem** (curto `--bg2/--text2/--muted` vs longo
  `--bg-secondary/--text-primary`), unificados por aliases em `theme.css`. → Padronizar **um só
  vocabulário** de tokens e documentá-lo.
- **CSS por página** (`index.css`, `generator.css`, `manual.css`, `library.css`) cresceu com
  componentes locais (cards, chips, matrizes) que deveriam ser **componentes do sistema**.
- **Ícones via emoji** (🌙 ☀️ 🕘 ⚙️ 💬 📋) — inconsistentes entre plataformas. → Adotar um
  **set de ícones SVG** coeso (peso/visual alinhados à tipografia).
- **Breakpoints divergentes** (768px em algumas páginas, 680px em outras). → Unificar a escala.
- **`admin.html` usa `<style>` inline.** → Migrar para o sistema.
- **Estados ausentes/improvisados:** skeletons de loading inexistem; empty states variam de
  tela para tela; não há tela de erro/404 nem de sessão expirada.

---

## 4. Telas atuais — diagnóstico e nível de intervenção

| Tela | Papel | Diagnóstico | Intervenção |
|---|---|---|---|
| **Home / Análise** (`index.html`) | Entrada + "Pontos de partida" (4 portas) + análise de domínios + matriz | Faz dois trabalhos (onboarding e enciclopédia de domínios). Hero das 4 portas é o ativo mais forte. | **Redesenhar** — separar "começar a usar" de "explorar domínios"; promover as 4 portas. |
| **Gerador** (`generator.html`) | Núcleo do produto: 25 templates, form, resultado | Sidebar com muitos itens; resultado e qualidade competem por espaço; mobile vira bottom-sheet. | **Redesenhar (prioridade máxima)** — ver §6. |
| **Biblioteca** (`library.html`) | Prompts salvos, coleções, tags, busca | Renderizada 100% em JS; falta tela de **detalhe do prompt** e estados ricos. | **Redesenhar parcial** + nova tela de detalhe. |
| **Manual** (`manual.html`) | Documentação + playground | Sólido, mas denso; navegação longa. | **Refinar** (tipografia/escaneabilidade), não refazer. |
| **Admin** (`admin.html`) | Métricas de telemetria | CSS inline; cards/tabelas simples. | **Redesenhar** como dashboard do sistema. |

---

## 5. Novas telas e superfícies sistêmicas a desenhar

Estas **não existem hoje** (ou existem só como modal/improviso) e são as principais entregas:

1. **Onboarding / primeira execução.** 1–3 passos leves: o que o app faz, escolha de
   idioma/tema, e atalho para a primeira "porta". Sem travar quem quer pular.
2. **Conta / Perfil.** Hoje só existe o **modal de magic link**. Desenhar uma superfície de
   conta: estado deslogado (entrar), estado "link enviado" (cheque seu e-mail + reenviar),
   verificando, logado (e-mail, sair, limite de uso anon vs autenticado), **sessão expirada**.
3. **Preferências como tela/painel dedicado.** Hoje é um dropdown (`buildPreferencesMenu`).
   Consolidar Aparência (tema + **escolha de acento**), Idioma, Dados (export/import), Conta.
4. **Biblioteca — detalhe do prompt.** Visualizar um prompt salvo (conteúdo, template de origem,
   tags, coleção, qualidade), com ações copiar/editar/abrir-na-IA/exportar/mover/excluir.
5. **Resultado do Gerador em foco.** Tratar o resultado como artefato central: leitura
   confortável do prompt (mono), chip de qualidade expandido, ações primárias claras, e modo
   "comparar antes/depois" (já é narrativa do produto no Manual).
6. **Estados sistêmicos** (kit completo, reutilizável em qualquer tela):
   - **Empty states** padronizados (biblioteca, histórico, "meus prompts", admin sem dados).
   - **Loading** com **skeletons** (não só texto "Carregando…").
   - **Erro** (genérico, com retry), **404/rota inválida**, **offline** (evoluir o banner).
   - **Rate limit (429)** com countdown — hoje só no chat; padronizar visual.
7. **Command Palette (Ctrl/⌘+K)** — redesenho como navegação primária de power-user.
8. **Navegação mobile** — padrão dedicado (bottom-nav ou drawer consistente) substituindo o
   hambúrguer + overlay atual, unificado entre as 5 telas.
9. **Assistente de chat** — redesenho do FAB + painel (estados: vazio/boas-vindas, pensando,
   erro, rate-limited, offline, sugestão de ebooks).

---

## 6. Foco: redesenho do Gerador (prioridade máxima)

É a tela onde o usuário passa mais tempo. Diretrizes:

- **Seleção de template** legível mesmo com 25 opções: agrupar por modo (Direto/Avançado) e 4
  categorias, com **busca** sempre visível e deep-link por `#t=<template>`.
- **Formulário** com hierarquia clara de campos obrigatórios (`*`) vs opcionais, validação inline
  (estado `.pe-invalid`), e o bloco opcional "Enriquecer com ebooks".
- **Geração e resultado**: o resultado deve poder ocupar o foco (split view no desktop;
  bottom-sheet com "pega" no mobile, já existente). Ações: Copiar, Editar (inline), Salvar,
  **Abrir na IA** (ChatGPT/Claude/Gemini), Exportar `.md`, Limpar.
- **Chip de qualidade** (`promptQuality.js`): desenhar os 4 níveis — **Forte / Bom / Fraco /
  Vazio** — com o anel de score, a dica principal (`topTip`) e a lista expansível dos 7 critérios
  (objetivo, contexto, entrada, formato, restrições, termos vagos, detalhamento).
- **Atalhos**: `Ctrl/⌘+Enter` gera; `Ctrl/⌘+K` abre a palette; `Esc` fecha overlays — exibir
  affordances discretas.

---

## 7. Matriz de estados (todo componente precisa cobrir)

Para **cada** componente interativo, entregue: `default · hover · focus-visible · active ·
disabled · loading · erro · sucesso`. Aplicar especialmente a:

- Botões (`.pe-btn`, `.pe-btn-secondary`, `.pe-icon-btn`)
- Inputs / textareas / selects (incluindo `.pe-invalid`)
- Cards (template, prompt salvo, ebook, métrica)
- Modais (`.pe-modal`: auth, salvar, confirmar exclusão, histórico)
- Toasts (`info` / `success` / `error`)
- Chat (FAB + painel, 6 estados — ver §5.9)
- Command palette (vazio, com resultados, item ativo)
- Chip de qualidade (4 níveis)

---

## 8. Foundations — diretrizes de tokens e temas

- **Manter oklch** e a escala fluida; **unificar o vocabulário de tokens** (um só nome por
  papel) e entregar a tabela de tokens como fonte da verdade (cor, tipografia, espaçamento 4px,
  raios `--r-sm/--r/--r-lg/--r-pill`, sombras, z-index, motion `--dur*`).
- **Temas:** claro e escuro para **todas** as telas e estados. Validar contraste nos dois.
- **Acento configurável:** desenhar a UI de escolha de acento (lime/amber/coral/violet/teal) e
  garantir que componentes não assumam o lime fixo.
- **Ícones:** propor um set SVG único substituindo os emojis.
- **Motion:** respeitar `prefers-reduced-motion`; transições curtas (`--dur-fast: .12s`,
  `--dur: .15s`), sem `transition: all`.

---

## 9. Acessibilidade e i18n (requisitos, não opcionais)

- **WCAG 2.1 AA**: contraste de texto e de componentes; foco visível (`:focus-visible`, offset
  2px); ordem de tabulação lógica; `trapFocus` em modais; `aria-*` e `role` corretos.
- **Teclado**: toda ação alcançável sem mouse; alvos de toque ≥ 44px no mobile.
- **i18n**: textos vêm de `assets/js/i18n.js` (pt completo, en agora também). Layouts toleram
  variação de comprimento; **nunca** embutir texto em imagem. Considerar números/datas por
  locale no Admin.
- **Estados não-visuais**: loading/erro/sucesso anunciados via `aria-live` (já usado no chat e
  no output).

---

## 10. Responsividade

- **Unificar breakpoints** (proposta: `sm` ~640, `md` ~768, `lg` ~1024, `xl` ~1320 = `--maxw`).
- **Mobile**: navegação consistente (§5.8); resultado do gerador como bottom-sheet; grids
  colapsam para 1 coluna; rail da biblioteca vira filtros horizontais.
- **Desktop**: aproveitar largura para split view (form + resultado) no gerador.

---

## 11. Entregáveis esperados (Figma)

1. **Foundations**: tabela de tokens (cores nos 2 temas + acentos, tipografia, espaçamento,
   raios, sombras, motion, grid/breakpoints) — como estilos/variáveis do Figma.
2. **Component library**: todos os componentes da §7 com variantes e estados, usando
   auto-layout e variáveis (espelhando os tokens).
3. **Telas** (claro + escuro, desktop + mobile):
   - Redesenho: Home, Gerador, Biblioteca (+ detalhe), Admin, refino do Manual.
   - Novas: Onboarding, Conta/Perfil (todos os estados de auth), Preferências, kit de estados
     sistêmicos (empty/loading/erro/404/offline/rate-limit).
4. **Protótipo** navegável do fluxo central (porta → gerar → resultado → salvar → biblioteca) e
   do fluxo de login (magic link, incl. retorno e sessão expirada).
5. **Handoff**: specs de espaçamento/tokens por componente e notas de acessibilidade
   (contraste, foco, ordem de tab).

---

## 12. Restrições técnicas (para o design ser implementável)

- Stack: **Vite + CSS vanilla com design tokens** (sem Tailwind/Bootstrap/MUI). Componentes são
  HTML semântico + classes `.pe-*`. Evitar padrões que exijam framework de UI.
- **PWA/offline**: assets enxutos; fontes já self-hosted (não adicionar webfonts externas — CSP
  é `connect-src 'self'`). Ícones como SVG inline/sprite, não pacotes pesados.
- **Sem dependência de imagens pesadas**: preferir SVG e CSS. Ilustrações de empty state devem
  ser leves e funcionar nos 2 temas.
- Reaproveitar componentes existentes (`resultPanel.js`, `saveDialog.js`, `commandPalette.js`,
  `common.js`) — o redesign deve mapear 1:1 com esses pontos de injeção quando possível.

---

## 13. Critérios de aceite (Definition of Done do design)

- [ ] Todas as telas entregues em **claro e escuro**, **desktop e mobile**.
- [ ] Todo componente com a **matriz de estados** da §7.
- [ ] **Contraste AA** verificado nos 2 temas; foco visível em todos os interativos.
- [ ] Layouts validados com **pt e en** (texto curto e longo) sem quebra.
- [ ] **Kit de estados sistêmicos** (empty/loading/erro/404/offline/rate-limit) reutilizável.
- [ ] **Tokens unificados** documentados e usados via variáveis no Figma.
- [ ] Protótipo do fluxo central + fluxo de login navegáveis.
- [ ] Handoff com specs e notas de acessibilidade.

---

## Anexo — Referência de arquivos (para inspeção do existente)

- Tokens: `frontend/assets/css/tokens.css` · Componentes compartilhados: `frontend/assets/css/theme.css`
- CSS por página: `frontend/assets/css/{index,generator,manual,library}.css` (+ `<style>` em `admin.html`)
- Tema: `frontend/assets/js/theme.js` · i18n (textos pt/en): `frontend/assets/js/i18n.js`
- Componentes JS injetados: `common.js` (topbar, menus, modais, banner offline, atalhos),
  `resultPanel.js` (resultado + ações), `saveDialog.js` (salvar), `commandPalette.js` (Ctrl/⌘+K),
  `chat.js` (assistente), `promptQuality.js` (chip de qualidade), `library.js`, `admin.js`.
- Telas: `frontend/{index,generator,manual,library,admin}.html`
