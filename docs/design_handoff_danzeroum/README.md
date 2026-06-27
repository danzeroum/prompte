# Handoff: Portfólio Danzeroum + Kit de Marca

## Overview
Portfólio pessoal de **Daniel Lau** — engenheiro de produto e desenvolvedor. Página única (one-page) com hero, seção "Links principais" (app em produção + GitHub open source), sobre, projetos, links dedicados e contato. Inclui o **kit de marca**: logo "Danzeroum" (D + escudo + circuito), favicon e tokens de design. Tema claro/escuro com toggle persistido.

URL de referência do dono: `danzeroum.com` · GitHub: `github.com/danzeroum`

## About the Design Files
Os arquivos deste pacote são **referências de design feitas em HTML** — protótipos que mostram a aparência e o comportamento pretendidos, **não código de produção para copiar diretamente**. A tarefa é **recriar estes designs no ambiente do codebase de destino** (React/Next, Vue, Astro, SvelteKit, etc.), usando os padrões e bibliotecas já estabelecidos ali. Se ainda não houver um ambiente, escolha o framework mais adequado (para um portfólio estático, **Astro** ou **Next.js estático** são ótimas opções) e implemente os designs nele.

O HTML é autocontido e usa apenas CSS + um pouco de JS puro — fácil de traduzir para componentes.

## Fidelity
**Alta fidelidade (hifi).** Cores, tipografia, espaçamentos e interações são finais. Recrie a UI fielmente usando os tokens em `brand/tokens.css`. Os valores exatos estão documentados abaixo e no `<style>` do `Daniel Lau - Portfolio.html`.

---

## Screens / Views

### Página única — `Daniel Lau - Portfolio.html`
Largura máxima de conteúdo **1080px**, centralizada, com gutter `clamp(22px, 5vw, 40px)`. Mobile-first; breakpoints em `min-width: 640px / 680px / 760px / 880px`.

#### 1. Header (sticky)
- **Layout:** flex, `justify-content: space-between`, altura **62px**. Fundo translúcido `color-mix(in srgb, var(--bg) 86%, transparent)` + `backdrop-filter: blur(10px)`, borda inferior `1px var(--line)`.
- **Brand (esquerda):** logo SVG (48px largura, altura auto) + texto "Daniel Lau" (600, 1rem, `--ink`). Em telas `<768px` o nome pode permanecer.
- **Nav (centro/direita):** links Sobre / Projetos / Links / Contato — `0.92rem`, `--muted`, hover `--ink` com fundo `--bg-2`, raio 8px. **Escondida em `<768px`** (mobile mostra só logo + toggle).
- **Toggle de tema (direita):** botão 40×40, borda `--line-2`, raio 10px. Ícone lua (claro) / sol (escuro).

#### 2. Hero
- **Layout:** padding `clamp(56px,11vw,120px)` topo. `position: relative; overflow: hidden`. Brilho radial âmbar sutil no canto superior direito (`::before`, `radial-gradient` de `--brand` a 16%).
- **Eyebrow (mono):** "● ENGENHEIRO DE PRODUTO · DESENVOLVEDOR" — `0.72rem`, letter-spacing `0.18em`, uppercase, `--faint`; o "●" em `--brand-ink`.
- **H1:** "Desenho e construo **produtos digitais** — da ideia ao deploy." — `clamp(2.3rem,6.4vw,3.8rem)`, 600, `-0.03em`, line 1.06, `max-width: 16ch`, `text-wrap: balance`. O trecho "produtos digitais" em `--brand-ink`.
- **Tagline:** `clamp(1.05rem,2.4vw,1.25rem)`, `--muted`, `max-width: 60ch`.
- **Primary links** (ver componente abaixo) logo após a tagline, `margin-top: 36px`, `max-width: 760px`.

#### 3. Componente "Primary Links" (aparece 3×: hero, seção dedicada, rodapé)
Grid `1fr` (mobile) → `1fr 1fr` (`min-width: 640px`), gap 14px.
- **Cada card (`.plink`):** flex, gap 18px, padding `20px 22px`, borda `1px var(--line-2)`, raio 14px, fundo `--bg`. Hover: `translateY(-2px)`, borda `--brand`, sombra `0 10px 30px -16px` (terracota 60%).
- **Ícone (48×48, raio 11px):** card "produção" (`.prod`) fundo `--brand`, ícone globo branco; card "repo" (`.repo`) fundo `--bg-2`, ícone GitHub `--ink`.
- **Texto:** título 600 1rem `--ink`; subtítulo mono `0.8rem` `--muted` (URL). Badge "Open source" no card do GitHub: mono `0.6rem`, uppercase, cor `--accent`, borda/fundo accent translúcido.
- **Seta (canto):** ícone ↗; no hover desloca `translate(3px,-3px)` e fica `--brand-ink`.
- **Links (manter o destino EXATO):**
  - Produção (VPS): `https://demo.buildtovalue.cloud` — rótulo "Ver aplicação em produção"
  - GitHub (open source): `https://github.com/danzeroum` — rótulo "Ver código no GitHub" + badge
  - Ambos: `target="_blank" rel="noopener noreferrer"`.

#### 4. Sobre (`#sobre`)
- Borda superior `1px var(--line)`, padding `clamp(56px,9vw,96px)`.
- Eyebrow "01 — Sobre". H2 "Produto e engenharia, na mesma pessoa."
- Grid `1fr` → (`min-width: 880px`) `1.4fr 0.9fr`: à esquerda 2 parágrafos + 2 grupos de chips ("Stack & ferramentas" e "Fora do código"); à direita uma lista `dl.facts` (linhas dt/dd com borda inferior).
- **Chips:** mono `0.8rem`, fundo `--bg-2`, borda `--line`, raio 8px, padding `7px 12px`. Chips de "Fora do código" usam cor `--brand-ink` e borda terracota suave.

#### 5. Projetos (`#projetos`)
- Eyebrow "02 — Projetos". H2 "Produtos que desenhei e construí." Intro com link "ver todos os 27 repositórios" → `https://github.com/danzeroum?tab=repositories`.
- **Grid de cards:** `1fr` → (`min-width: 680px`) `1fr 1fr`, gap 16px. Renderizados via JS a partir do array `PROJECTS` (6 itens — os repos fixados no GitHub).
- **Card (`.card`):** borda `1px var(--line)`, raio 16px, padding `26px 26px 20px`, fundo `--bg`. Hover: `translateY(-3px)` + sombra.
  - Topo: tag (mono, terracota suave) + status (mono com bolinha `--accent`).
  - H3 1.28rem 600; slug mono `0.74rem` `--faint` (`danzeroum/<repo>`); descrição `0.96rem` `--muted`.
  - Tech chips (mono, borda `--line`).
  - Links no rodapé do card: "Ver demo ↗" (só se houver demo) + "Repositório" (GitHub). Ambos `_blank` + `noopener`.
- **Dados dos 6 projetos** (nome · repo · demo):
  1. btvChatCorp · `btvChatCorp` · chatcorp.buildtovalue.cloud
  2. BuildToValue Governance · `BuildToValueGovernance` · demo.buildtovalue.cloud
  3. Central de Inteligência Jurídica · `Central_Inteligencia_Juridica` · juridico.buildtovalue.cloud
  4. ConciliaIA · `ConciliaIA` · conciliaia.buildtovalue.cloud
  5. CriptoTrade · `Criptotrade` · criptotrade.buildtovalue.cloud
  6. ExecutAgent · `executagent` · executagent.buildtovalue.cloud

#### 6. Links principais dedicada (`#links`)
Eyebrow "03 — Links principais", H2 "Veja funcionando — e por dentro.", e o componente Primary Links repetido.

#### 7. Contato (`#contato`)
Eyebrow "04 — Contato", H2 "Bora construir algo juntos?". Lista de 3 linhas (`.contact-row`): Email (`mailto:dan@example.com` — **placeholder, trocar pelo real**), LinkedIn (`https://www.linkedin.com/in/daniel-lau-pereira-soares`), GitHub (`https://github.com/danzeroum`). Cada linha: ícone `--brand-ink`, rótulo mono, valor 600 `--ink`.

#### 8. Footer
- Borda superior `1px var(--line)`, fundo `--bg-2`.
- Bloco "Acesso rápido" com o componente Primary Links repetido.
- Grid `1fr` → (`min-width: 760px`) `2fr 1fr 1fr`: coluna marca (logo + descrição) + Navegação + Conecte-se.
- Barra inferior: "© 2026 Daniel Lau Pereira Soares" / "Feito com código · SP, Brasil".

---

## Interactions & Behavior
- **Toggle de tema:** alterna a classe `dark` no `<html>` e persiste em `localStorage('theme')`. Há um script **inline no `<head>`** que aplica o tema antes da pintura (evita flash) — replicar isso no app de destino (ex.: script de tema no `<head>` ou cookie no SSR).
- **Animação do logo:** ao carregar, o circuito "desenha" (stroke-dashoffset 1→0) e os nós surgem (opacity 0→1), em sequência. **Regra crítica:** o estado-padrão do logo é VISÍVEL; a animação só é ativada quando a classe `anim-logo` é adicionada ao `<html>` via JS após dois `requestAnimationFrame`, e somente se `prefers-reduced-motion` não for `reduce`. Isso garante que o logo nunca fique invisível se a animação não rodar. Ver `@keyframes logoDraw / logoPop`.
- **Navegação:** âncoras com `scroll-behavior: smooth` e `scroll-margin-top: 80px` nas seções.
- **Hovers:** botões `translateY(-2px)`; cards `translateY(-2/3px)` + sombra; setas dos primary links deslizam.
- **Responsivo:** nav some `<768px` (considere um menu mobile no app real — o protótipo apenas oculta a nav). Grids colapsam conforme breakpoints citados.

## State Management
Mínimo: apenas `theme` (claro/escuro) em `localStorage`. O array `PROJECTS` é estático no JS — no app real, mova para um arquivo de dados/JSON ou CMS. Nenhuma chamada de rede.

## Design Tokens
Ver `brand/tokens.css` (completo, claro + escuro). Resumo:
- **Marca:** terracota `#bd4e1c` (texto AA: `#b3470f`), marinho `#24324a`, teal `#0f7d6b`.
- **Neutros claros:** bg `#fbf7f1`, bg-2 `#f4ece1`, ink `#231a14`, text `#4a3d33`, muted `#7a6a5b`, faint `#9c8a78`, line `#e6dccd`, line-2 `#d3c4ae`.
- **Neutros escuros:** bg `#141009`, bg-2 `#1d160e`, ink `#f6ede1`, text `#d6c6b4`, line `#2e2418`; marca terracota `#e8772f`.
- **Tipografia:** IBM Plex Sans (400–700) + IBM Plex Mono (400/500). Escala no `tokens.css`.
- **Raios:** 5 / 12 / 16 / 20 px. **Easing:** `cubic-bezier(.2,.7,.3,1)`. **Maxw:** 1080px.

## Assets
- **Logo (kit de marca, pasta `brand/`):**
  - `logo-danzeroum.svg` — versão para fundo claro (D terracota, escudo marinho).
  - `logo-danzeroum-dark.svg` — versão para fundo escuro (D/circuito terracota, escudo creme).
  - `favicon.svg` — D + escudo recortado (sem circuito) para 16–32px.
  - As cores do logo são controladas por variáveis (`--logo-d`, `--logo-shield`, `--logo-circuit`, `--logo-ink`) — no app, prefira **um único SVG inline com `currentColor`/variáveis** que troca via tema, em vez de dois arquivos.
  - Conceito: requisição entra (circuito simétrico à esquerda) → escudo-D processa/protege → ramifica em 3 caminhos (leque à direita). Wordmark "dan**zero**um" com "zero" em terracota.
  - `brand/Logo Danzeroum — final.html` mostra todas as escalas/lockups; `brand/Logo Danzeroum — circuito (variações).html` traz variações do circuito.
- **Ícones:** SVGs inline (globo, GitHub, LinkedIn, email, setas, check). Sem dependência de biblioteca — pode trocar pelos ícones do design system do app.
- **Fontes:** Google Fonts (IBM Plex Sans + Mono). Self-host recomendado em produção.

## Files
- `Daniel Lau - Portfolio.html` — protótipo principal (hifi, autocontido). Toda a UI, CSS e JS estão aqui.
- `brand/logo-danzeroum.svg`, `brand/logo-danzeroum-dark.svg`, `brand/favicon.svg` — ativos de marca prontos.
- `brand/tokens.css` — tokens de design (importar/traduzir para o sistema do app).
- `brand/Logo Danzeroum — final.html` — folha de uso do logo (escalas, lockups, claro/escuro).
- `brand/Logo Danzeroum — circuito (variações).html` — explorações do circuito.

## Notas / pendências do dono
- **Email** está como placeholder `dan@example.com` — substituir pelo real.
- Confirmar que todos os demos `*.buildtovalue.cloud` estão no ar; remover "Ver demo" de cards sem demo ativo.
- Os dois repositórios de governança (`BuildToValueGovernance`) são o produto principal — manter o link PascalCase.
