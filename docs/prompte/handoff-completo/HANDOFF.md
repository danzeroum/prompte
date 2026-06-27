# Handoff completo — Redesign sistêmico do `prompte`

> **Para:** Claude Code, implementando no repositório **`danzeroum/prompte`** (pasta `frontend/`).
> **O que é:** o pacote único que consolida todo o trabalho de design em um só lugar — protótipos navegáveis, design tokens e a especificação de implementação de **13 superfícies**, mapeadas 1:1 para os módulos reais do repo.
> **Stack alvo:** Vite + HTML semântico + **CSS vanilla com design tokens** + JS em módulos ES. **Sem framework de UI.** Supabase (auth magic-link, telemetria, cache, Edge Functions), i18n pt/en, tema claro/escuro.

---

## 0. Como usar este documento

1. **Abra os dois protótipos no navegador** para sentir o comportamento (são a spec visual/interativa — não código de produção para copiar):
   - `design-reference/Proposta de Layout - prompte.html` → Home, Gerador unificado, Biblioteca, Assistente de Qualidade.
   - `design-reference/Telas Sistemicas - prompte.html` → as outras 9 superfícies (auth, kit de estados, detalhe do prompt, onboarding, preferências, admin, manual, nav mobile, chat). Navegue pelo índice à esquerda; alterne tema/dispositivo na barra superior.
2. **Leia a §1 (princípios) e a §2 (o que já existe)** antes de codar. A regra de ouro: **construir sobre os módulos existentes**, não reescrever.
3. Siga a **sequência de PRs (§5)** — está ordenada por dependência e risco.
4. Os protótipos são **React/HTML estático** só por conveniência de prototipagem. **Reimplemente o comportamento em JS vanilla** dentro da arquitetura do repo.

> **Já existe um handoff detalhado** para duas das features (Biblioteca + Assistente de Qualidade) em `../design_handoff_biblioteca_e_qualidade/README.md`. Este documento **incorpora e estende** aquele para cobrir todas as telas. Onde houver detalhe extra (modelo de dados, SQL de migração), o README específico é a fonte canônica — está referenciado nos pontos certos.

---

## 1. Princípios (não-negociáveis)

Herdados do brief de design sistêmico:

1. **Sistêmico antes de telas.** Tudo nasce de **tokens + componentes `.pe-*` reutilizáveis**. Mudar um token propaga para todas as telas. Zero one-offs.
2. **Foco na tarefa.** O fluxo central é *escolher template → preencher → gerar → usar o resultado*. Cada tela reduz fricção nesse caminho.
3. **Estado sempre visível.** Todo componente cobre: `default · hover · focus-visible · active · disabled · loading · erro · sucesso · vazio · offline`.
4. **Offline-first honesto.** Geração por template funciona sem backend; só recursos de rede (IA/sync) ficam indisponíveis — e isso é comunicado, não bloqueia o resto.
5. **Acessível por padrão.** WCAG 2.1 AA: contraste, `:focus-visible` (offset 2px), navegação por teclado, `trapFocus` em modais, `aria-*`/`role`, `prefers-reduced-motion`, alvos de toque ≥ 44px.
6. **Bilíngue por construção.** Textos vêm de `i18n.js`; layouts toleram pt/en (±15–30% de comprimento). Nunca largura fixa dependente de string; nunca texto em imagem.
7. **Densidade calibrada.** É ferramenta, não landing. Leitura e ação primeiro, com respiro. Mobile é primeira-classe.

---

## 2. O que JÁ EXISTE no repo (NÃO reimplementar)

> Seção mais importante. Construa sobre estas peças.

### Tokens & tema
- `assets/css/tokens.css` — design tokens em **oklch**, tipografia fluida (`clamp()`), escala 4px, raios, sombras, z-index, motion. **Já foi adotado** (o redesign migrou para cá).
- `assets/css/theme.css` — **componentes compartilhados** `.pe-btn`, `.pe-btn-secondary`, `.pe-icon-btn`, `.pe-modal`, `.pe-toast`, `.pe-chat-*`, command palette, glossário inline, banner offline. **Carregado em todas as páginas.**
- `assets/js/theme.js` — alterna `.light-theme` + `prefers-color-scheme`.

### Módulos JS (pontos de injeção / reuso)
| Módulo | Papel |
|---|---|
| `common.js` | topbar, menus, modais, banner offline, atalhos, `trapFocus`, `collectFormData` |
| `generators.js` | catálogo dos **25 templates** (`{ name, fields:[{id,type,...}], build() }`) — fonte da verdade |
| `resultPanel.js` | painel de resultado + ações (copiar/editar/salvar/abrir-na-IA/exportar) |
| `saveDialog.js` | diálogo de salvar |
| `savedPrompts.js` | **persistência nuvem-primeiro + fallback local** (ver README específico §4) |
| `promptQuality.js` | chip de qualidade (já existe — alvo do redesign do Assistente) |
| `commandPalette.js` | Ctrl/⌘+K |
| `glossary.js` | glossário inline do jargão (WSJF, INVEST, Tuckman…) |
| `chat.js` | assistente LLM (FAB + painel) |
| `library.js`, `admin.js` | Biblioteca e Admin |
| `i18n.js` | textos pt/en |

### Telas (multipágina)
`index.html` (Home/Análise) · `generator.html` (Gerador) · `manual.html` · `library.html` · `admin.html`.

---

## 3. Dívidas técnicas a corrigir no redesign

Levantadas na auditoria do código real — resolver junto com as telas:

1. **🔴 Componentes compartilhados presos em CSS de página.** `.topbar` e `.pe-btn` estão definidos **só em `index.css`**, mas `library.html` (e futuras páginas) não o carregam → **topbar quebra** (empilha em coluna, sem barra). **Fix:** mover `.topbar`, `.topbar-brand`, `.pe-btn` para `theme.css` (carregado em todas as páginas) e **remover as cópias** de `index.css`. *(Causa raiz da distorção reportada em `library.html`.)*
2. **Dois vocabulários de token convivem** (`--bg2/--text2` vs `--bg-secondary/--text-primary`, unidos por aliases). Padronizar **um só nome por papel** e documentar.
3. **CSS por página** acumulou componentes locais (cards, chips, matrizes) que deveriam ser do sistema. Promover para `theme.css`.
4. **Ícones via emoji** (🌙☀️🕘⚙️💬📋) — inconsistentes entre plataformas. **Adotar o set SVG** entregue (ver §4.0).
5. **Breakpoints divergentes** (768 vs 680). Unificar: `sm 640 · md 768 · lg 1024 · xl 1320 (= --maxw)`.
6. **`admin.html` usa `<style>` inline.** Migrar para o sistema.
7. **Estados ausentes/improvisados:** sem skeletons, empty states variam por tela, sem 404/erro/sessão-expirada. Resolvido pelo **kit de estados** (§4, tela 3).

---

## 4. As 13 superfícies — especificação por tela

> Notação: cada tela lista **Protótipo** (onde ver), **Arquivos reais** (onde implementar), **Reuso** (o que NÃO reescrever) e **Notas**.

### 4.0 — Foundations: set de ícones SVG
- **Protótipo:** o `<svg>` sprite (`<symbol id="i-*">`) no topo de `Telas Sistemicas - prompte.html` (≈30 ícones: mail, user, check, alert, wifi-off, refresh, library, search, sun/moon, folder, tag, copy, edit, external, trash, download/upload, globe, palette, sliders, chart, users, trending, code, database, book, message, send, menu, x, sparkle, play…).
- **Real:** extrair o sprite para `frontend/assets/icons.svg` (ou inline em `common.js`); criar helper `icon(id)` → `<svg class="ic"><use href="#i-..."/></svg>`. Substituir os emojis nas 5 telas. Traço alinha com a tipografia (`stroke-width:1.8`, `currentColor`).
- **Aceite:** nenhum emoji de UI remanescente; ícones herdam cor via `currentColor`.

### Bloco A — Núcleo do produto *(protótipo: `Proposta de Layout - prompte.html`)*

### 4.1 — Navegação primária persistente
- **Real:** injetar em `common.js` (topbar), aplicar nas 5 páginas. Itens **Início · Gerador · Biblioteca**, item ativo via `aria-current="page"`.
- **Reuso:** topbar existente. **Depende da dívida 3.1** (mover `.topbar` para `theme.css`).

### 4.2 — Gerador unificado (prioridade máxima)
- **Protótipo:** tela "Gerador" — switch **Direto ↔ Avançado**, busca sempre visível, rail de 25 templates por categoria, **prévia** e split view.
- **Real:** `generator.html` + `generators.js`. O switch filtra o catálogo por um campo `mode` (`direto` = grupo "Código direto"; `avancado` = repo + diff + domínios). Deep-link `#t=<template>`.
- **Reuso:** `generators.js` (catálogo + `build()`), `resultPanel.js`, `commandPalette.js`, `glossary.js`.
- **Spec do switch:** detalhada em `Handoff - prompte.html` (doc de tokens) e no README específico. É a mudança de **maior risco técnico** — extrair o catálogo para um registro único com `mode` **antes** de plugar a UI.

### 4.3 — Biblioteca (coleções, favoritos, tags, busca)
- **Protótipo:** tela "Biblioteca" + card de prompt + save dialog.
- **Real / modelo de dados / SQL de migração:** **fonte canônica = `../design_handoff_biblioteca_e_qualidade/README.md`** (§4–§7). Reusa `savedPrompts.js`, `saveDialog.js`. Nova tela em `library.html`/`library.js`.
- **Cuidado:** ao reabrir um salvo, **não** re-registrar no histórico (passar flag para `resultPanel`).

### 4.4 — Assistente de Qualidade ("ESLint para prompts")
- **Protótipo:** rodapé do painel de prévia + chip no resultado; `assets/assistant.jsx` tem o algoritmo `analyzePrompt()` (JS puro, portável).
- **Real:** evoluir `promptQuality.js`. Os 4 níveis (**Vazio/Fraco/Bom/Forte**) + anel de score + `topTip` + checklist dos **7 critérios**.
- **🔴 Correção 1 (obrigatória):** o `analyzePrompt()` do protótipo casa campos por `label`, mas `generators.js` declara campos **sem label** (só `id`). **Reescrever as heurísticas para casar por `id`** (ex.: contexto → `/-(contexto|requisito|funcionalidade|objetivo|gargalo)/`; entrada concreta → `/-(codigo|arquivo|repo|comp|erro|escopo|caminho)/`). Detalhe completo no README específico.
- **🔴 Correção 2 (obrigatória):** o gerador real **não tem prévia ao vivo**. **v1:** calcular a qualidade **no clique em Gerar** e renderizar no `resultPanel.js` (chip no header + checklist expansível). "Live enquanto digita" é um stretch separado (anexar listener de `input` no painel ativo → `collectFormData` → `build` → `analyzePrompt`).

### Bloco B — Telas sistêmicas *(protótipo: `Telas Sistemicas - prompte.html`)*

### 4.5 — Conta / Perfil (5 estados de auth)
- **Protótipo:** seção "Conta / Perfil": deslogado, link enviado (countdown de reenvio), verificando, logado (uso/plano/sync/sair), sessão expirada.
- **Real:** hoje só existe o **modal de magic link**. Promover a superfície dedicada; integrar ao fluxo Supabase (magic link, retorno com token, 401 → sessão expirada preservando contexto).
- **Reuso:** `.pe-modal`, `trapFocus`, `.pe-btn`/`.pe-btn-danger`. `aria-live` no countdown.

### 4.6 — Kit de estados sistêmicos (reutilizável)
- **Protótipo:** seção "Kit de estados": **empty** (padrão único), **loading com skeleton** (espelha o card real), **erro + retry**, **404/rota inválida**, **offline** (banner + tela), **rate-limit 429** (anel + countdown, `aria-live`), **toasts** (success/error/info).
- **Real:** criar `states.js` + estilos no `theme.css` como **componentes do sistema**, consumidos por qualquer tela. Skeletons respeitam `prefers-reduced-motion`. Padronizar o 429 (hoje só no chat).
- **Aceite:** uma única implementação de cada estado, reutilizada (não copiada) entre Biblioteca, histórico, admin, chat.

### 4.7 — Detalhe do prompt (Biblioteca)
- **Protótipo:** "Detalhe do prompt" — prompt em mono à esquerda; metadados (template, coleção, datas) + **chip de qualidade expandido** à direita; barra de ações (copiar/editar/abrir-na-IA/exportar/mover/excluir).
- **Real:** nova rota/tela em `library.js`. Reusa `resultPanel.js` (ações) e `promptQuality.js` (chip). Abrir a partir do card da Biblioteca.

### 4.8 — Onboarding (primeira execução)
- **Protótipo:** "Onboarding" — 3 passos puláveis: boas-vindas + 4 portas; escolha de tema/idioma/**acento** (aplicam ao vivo); escolher a primeira porta (deep-link).
- **Real:** novo módulo; gatilho na 1ª visita; persistir conclusão em `localStorage['pe:onboarded']`. Idioma/tema reusam `i18n.js`/`theme.js`. Pulável sem travar.

### 4.9 — Preferências (tela dedicada)
- **Protótipo:** "Preferências" — abas Aparência (tema + **swatches de acento** lime/amber/coral/violet/teal + densidade + "menos movimento") / Idioma / Dados (export/import/limpar) / Conta.
- **Real:** consolidar o dropdown `buildPreferencesMenu` numa tela. **Acento não-fixo:** sobrescrever `--accent` na raiz (não assumir lime). Export/import operam sobre `savedPrompts.js`.

### 4.10 — Admin (dashboard)
- **Protótipo:** "Admin" — 4 KPIs com delta, gráfico de barras (CSS), donut por categoria (SVG), tabela de eventos.
- **Real:** `admin.html`/`admin.js`. **Migrar do `<style>` inline** para o sistema (dívida 3.6). Gráficos em CSS/SVG (sem libs pesadas — restrição PWA). Datas por locale (`i18n`).

### 4.11 — Manual (refino, não refazer)
- **Protótipo:** "Manual" — TOC ancorada, escala tipográfica, callouts, blocos de código, **playground**.
- **Real:** `manual.html`. Refino tipográfico/escaneabilidade; manter conteúdo. Playground reusa `generators.js` + `promptQuality.js`. Glossário inline via `glossary.js`.

### 4.12 — Navegação mobile dedicada
- **Protótipo:** "Nav mobile" — **bottom-nav fixa** (4 destinos + "Gerar" em destaque) + **drawer "Mais"**; substitui hambúrguer+overlay; alvos ≥ 44px.
- **Real:** padrão único em `common.js`, aplicado nas 5 páginas no breakpoint `sm/md`. `env(safe-area-inset-bottom)` para notch. Drawer com `trapFocus`.

### 4.13 — Chat / assistente (6 estados)
- **Protótipo:** "Chat" — FAB + painel; seletor percorre **boas-vindas** (sugestões), **pensando** (typing), **resposta + sugestão de ebook**, **rate-limit**, **offline**, **erro**. Input desabilita sem rede.
- **Real:** redesenho de `chat.js`. Reusa `.pe-chat-*`. Estados anunciados via `aria-live`. Rate-limit usa o componente 429 do kit (§4.6). Offline coordena com o banner global.

---

## 5. Sequência de PRs (ordenada por dependência e risco)

> Cada PR é entregável e revisável isoladamente. Não empacotar tudo num só.

| PR | Escopo | Depende de | Risco |
|---|---|---|---|
| **PR1** | **Fix dívida 3.1** — mover `.topbar`/`.pe-btn` para `theme.css`, remover de `index.css` | — | baixo (corrige bug em produção) |
| **PR2** | **Foundations** — extrair sprite SVG (§4.0), unificar tokens (3.2) e breakpoints (3.5) | PR1 | baixo |
| **PR3** | **Kit de estados** (§4.6) — `states.js` + componentes no `theme.css` | PR2 | baixo (base de tudo) |
| **PR4** | **Nav primária + nav mobile** (§4.1, §4.12) nas 5 páginas | PR1, PR2 | médio |
| **PR5** | **Biblioteca + Detalhe do prompt** (§4.3, §4.7) | PR3 | médio — ver README específico (migração SQL) |
| **PR6** | **Gerador unificado** (§4.2) — registro único com `mode`, switch | PR2 | **alto** (prototipar o switch isolado primeiro) |
| **PR7** | **Assistente de Qualidade** (§4.4) — com **Correções 1 e 2** | PR6 | médio |
| **PR8** | **Conta/Perfil + Preferências** (§4.5, §4.9) | PR3 | médio (integra Supabase auth) |
| **PR9** | **Admin** (§4.10) — sair do `<style>` inline | PR2, PR3 | baixo |
| **PR10** | **Manual (refino) + Chat redesign** (§4.11, §4.13) | PR3 | baixo/médio |
| **PR11** | **Onboarding** (§4.8) | PR8 | baixo |

---

## 6. Definition of Done (do design, por tela)

- [ ] Renderiza em **claro e escuro**, **desktop e mobile**.
- [ ] Cobre a **matriz de estados** aplicável (default/hover/focus/active/disabled/loading/erro/sucesso/vazio/offline).
- [ ] **Contraste AA** nos 2 temas; `:focus-visible` em todo interativo; ordem de tab lógica; `trapFocus` em overlays.
- [ ] Validada com **pt e en** (texto curto e longo) sem quebra de layout.
- [ ] Usa **tokens** e **componentes `.pe-*`** — nenhum valor hardcoded, nenhum one-off.
- [ ] **Sem emoji de UI**; ícones via sprite SVG.
- [ ] `prefers-reduced-motion` respeitado; transições curtas (`--dur-fast`/`--dur`), nunca `transition: all` com custom property animando `background` (ver nota CSS).
- [ ] Reusa os módulos JS existentes nos pontos de injeção mapeados (§2, §4).

---

## 7. Notas técnicas de CSS (aprendidas no protótipo)

- **Nunca anime `background` via `transition: all`** quando o valor vem de custom property — a transição "congela" no valor antigo ao trocar tema. Use listas explícitas: `transition: color .15s, border-color .15s, box-shadow .15s`.
- **Em `input`/`textarea`/`select` use `appearance: none`** para repaint confiável de `background` na troca de tema (controles nativos não repintam só com mudança de custom-prop herdada).
- **Acento configurável:** componentes leem `--accent` — nunca o hex lime fixo. Trocar acento = sobrescrever `--accent` (e derivados `--accent-soft`/`--accent-line` via `color-mix`).

---

## 8. Inventário de arquivos deste pacote

```
handoff-completo/
├── HANDOFF.md                      ← este documento (mestre)
├── tokens.css                      ← design tokens (oklch) prontos p/ importar
└── design-reference/
    ├── Proposta de Layout - prompte.html   ← Bloco A: Home, Gerador, Biblioteca, Qualidade
    ├── assets/  (data.js, app.jsx, components.jsx, library.jsx, assistant.jsx, prompte.css)
    ├── tweaks-panel.jsx
    ├── Telas Sistemicas - prompte.html     ← Bloco B: auth, estados, detalhe, onboarding,
    │                                          preferências, admin, manual, nav mobile, chat
    └── telas-sistemicas/  (tokens.css, sistema.css, shell.css, telas2.css, telas3.css, screens.js)
```

**Handoffs relacionados (canônicos onde indicado):**
- `../design_handoff_biblioteca_e_qualidade/README.md` — Biblioteca + Assistente de Qualidade (modelo de dados, SQL, algoritmo `analyzePrompt`).
- `../Handoff - prompte.html` — doc visual de tokens + spec do switch Direto↔Avançado.

---

*Fim. Comece pelo PR1 (corrige o bug visível em produção) e siga a tabela §5. Em caso de divergência entre protótipo e código real, o código real vence — reimplemente o comportamento, não copie o protótipo.*
