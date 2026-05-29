# Referência de Scripts — Prompt Engineering Pro

Documentação **clicável** de todos os scripts do projeto. Cada função tem link
para a sua definição no código (`arquivo#Llinha`). Para o grafo de dependências
e o fluxo de uma requisição, veja [`ARQUITETURA.md`](./ARQUITETURA.md). Para a
explicação ligada ao código, veja [`EXPLICACAO-CODIGO.md`](./EXPLICACAO-CODIGO.md).

> Base dos links: `https://github.com/danzeroum/prompte/blob/main/`

## Índice
- [Frontend — módulos ES](#frontend--módulos-es)
  - [`app.js`](#appjs) · [`common.js`](#commonjs) · [`theme.js`](#themejs) · [`i18n.js`](#i18njs) · [`preferences.js`](#preferencesjs) · [`validation.js`](#validationjs)
  - [`supabaseClient.js`](#supabaseclientjs) · [`telemetry.js`](#telemetryjs) · [`promptCache.js`](#promptcachejs) · [`llmClient.js`](#llmclientjs) · [`generators.js`](#generatorsjs)
  - [`auth.js`](#authjs) · [`metricsClient.js`](#metricsclientjs) · [`admin.js`](#adminjs)
- [Backend — Edge Functions (Deno)](#backend--edge-functions-deno)
  - [`prompt-llm`](#edge-prompt-llm) · [`metrics`](#edge-metrics)
- [Banco de dados (PostgreSQL)](#banco-de-dados-postgresql)
- [Páginas HTML e configuração](#páginas-html-e-configuração)

---

## Frontend — módulos ES

Todos em [`frontend/assets/js/`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js).
Carregados via [`app.js`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/app.js)
(e [`admin.js`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/admin.js) na página admin),
referenciados nos HTMLs por `<script type="module">`
([index.html:12](https://github.com/danzeroum/prompte/blob/main/frontend/index.html#L12),
[admin.html:13](https://github.com/danzeroum/prompte/blob/main/frontend/admin.html#L13)).

### `app.js`
[Arquivo](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/app.js) ·
**Ponto de entrada.** Orquestra o boot de todas as páginas (exceto a lógica inline de cada HTML).

| Função | Linha | Descrição |
|---|---|---|
| `mountManualPlayground()` | [L13](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/app.js#L13) | Monta o playground no `manual.html` (container [`#pe-playground`](https://github.com/danzeroum/prompte/blob/main/frontend/manual.html#L932)) usando [`buildPrompt`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/generators.js#L31). |
| `init()` | [L53](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/app.js#L53) | Chama `initTheme`, `initI18n`, `enhanceNavigation`, `injectTopbarControls`, `initAuth`, agenda `flush` e expõe [`window.PE`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/app.js#L70). |

**Importa:** [`theme`](#themejs), [`i18n`](#i18njs), [`common`](#commonjs), [`telemetry`](#telemetryjs), [`generators`](#generatorsjs), [`llmClient`](#llmclientjs), [`auth`](#authjs) ([L5–L11](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/app.js#L5)).
**Usado por:** os quatro HTMLs.

### `common.js`
[Arquivo](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/common.js) ·
Comportamentos compartilhados aplicados de forma **não invasiva** ao HTML existente.

| Função | Linha | Descrição |
|---|---|---|
| `enhanceNavigation()` | [L21](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/common.js#L21) | Acessibilidade da sidebar: `role`/`tabindex`/teclado e `aria-current` via `MutationObserver`. Ignora `<a>`/`<button>`. |
| `copyText()` | [L57](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/common.js#L57) | Copia texto + toast ([`showToast`](#validationjs)). Exposto em `window.PE`. |
| `buildIconButton()` | [L69](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/common.js#L69) | Cria um botão de ícone da topbar. |
| `injectTopbarControls()` | [L80](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/common.js#L80) | Injeta toggle de tema ([`toggleTheme`](#themejs)) e o menu de preferências na `.topbar`. |
| `buildPreferencesMenu()` | [L119](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/common.js#L119) | Menu: tema, idioma ([`setLang`](#i18njs)), export/import ([`preferences`](#preferencesjs)) e **Conta** ([`auth`](#authjs)). |
| `openAuthModal()` / `buildAuthModal()` | [L249](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/common.js#L249) / [L256](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/common.js#L256) | Modal de login por magic link → [`signInWithEmail`](#authjs). |

**Importa:** [`theme`](#themejs), [`i18n`](#i18njs), [`preferences`](#preferencesjs), [`validation`](#validationjs), [`auth`](#authjs).
**Usado por:** [`app.js`](#appjs).

### `theme.js`
[Arquivo](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/theme.js) ·
Tema claro/escuro (precedência: escolha do usuário > sistema > escuro).

| Função | Linha |
|---|---|
| `systemPrefersLight()` | [L10](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/theme.js#L10) |
| `resolveTheme()` | [L15](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/theme.js#L15) |
| `applyTheme()` | [L21](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/theme.js#L21) |
| `currentTheme()` | [L25](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/theme.js#L25) |
| `toggleTheme()` | [L30](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/theme.js#L30) |
| `initTheme()` | [L38](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/theme.js#L38) |

**Importa:** [`preferences`](#preferencesjs). **Usado por:** [`app.js`](#appjs), [`common.js`](#commonjs). CSS: `.light-theme` em [`theme.css`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/css/theme.css#L49).

### `i18n.js`
[Arquivo](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/i18n.js) ·
Internacionalização via atributos `data-i18n` (pt completo / en em expansão).

| Símbolo | Linha | Descrição |
|---|---|---|
| `DICT` | [L9](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/i18n.js#L9) | Dicionário pt/en. |
| `getLang()` / `setLang()` | [L86](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/i18n.js#L86) / [L90](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/i18n.js#L90) | Lê/define idioma (persiste via [`setPreference`](#preferencesjs)). |
| `t()` | [L99](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/i18n.js#L99) | Traduz chave (fallback pt → própria chave). |
| `applyI18n()` | [L104](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/i18n.js#L104) | Aplica traduções a `[data-i18n]`. |
| `initI18n()` | [L114](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/i18n.js#L114) | Boot do idioma. |

**Importa:** [`preferences`](#preferencesjs). **Usado por:** [`app.js`](#appjs), [`common.js`](#commonjs), [`validation.js`](#validationjs).

### `preferences.js`
[Arquivo](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/preferences.js) ·
Preferências (tema/idioma) em `localStorage`; base para sync futuro.

| Símbolo | Linha |
|---|---|
| `PREFS_KEY` | [L5](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/preferences.js#L5) |
| `getPreferences()` | [L12](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/preferences.js#L12) |
| `setPreference()` | [L21](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/preferences.js#L21) |
| `exportPreferences()` | [L33](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/preferences.js#L33) |
| `importPreferences()` | [L39](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/preferences.js#L39) |

**Usado por:** [`theme.js`](#themejs), [`i18n.js`](#i18njs), [`common.js`](#commonjs).

### `validation.js`
[Arquivo](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/validation.js) ·
Validação de campos + toasts.

| Função | Linha | Descrição |
|---|---|---|
| `ensureWrap()` | [L8](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/validation.js#L8) | Garante o container de toasts. |
| `showToast()` | [L19](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/validation.js#L19) | Exibe toast (info/success/error). |
| `validateRequired()` | [L43](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/validation.js#L43) | Marca campos vazios (`.pe-invalid`). |
| `guardRequired()` | [L66](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/validation.js#L66) | Valida + toast + foca o primeiro vazio. |

**Importa:** [`i18n`](#i18njs). **Usado por:** [`common.js`](#commonjs) (`showToast`); `guardRequired` disponível para a lógica inline das páginas.

### `supabaseClient.js`
[Arquivo](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/supabaseClient.js) ·
Inicialização **preguiçosa** (import dinâmico) do `supabase-js`.

| Função | Linha | Descrição |
|---|---|---|
| `supabaseConfig()` | [L9](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/supabaseClient.js#L9) | Lê `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`. |
| `isConfigured()` | [L17](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/supabaseClient.js#L17) | Há config? |
| `getSupabase()` | [L24](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/supabaseClient.js#L24) | Cliente único (`persistSession` ligado p/ auth) ou `null`. |

**Usado por:** [`auth`](#authjs), [`telemetry`](#telemetryjs), [`promptCache`](#promptcachejs), [`llmClient`](#llmclientjs), [`metricsClient`](#metricsclientjs). É o **hub** do acesso ao backend.

### `telemetry.js`
[Arquivo](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/telemetry.js) ·
Telemetria offline-first (fila em `localStorage` → tabela [`events`](#banco-de-dados-postgresql)).

| Função | Linha | Descrição |
|---|---|---|
| `getSessionId()` | [L12](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/telemetry.js#L12) | Id de sessão (sessionStorage). |
| `readQueue()` | [L27](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/telemetry.js#L27) | Lê a fila local. |
| `track()` | [L36](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/telemetry.js#L36) | Enfileira um evento. |
| `getQueue()` / `clearQueue()` | [L55](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/telemetry.js#L55) / [L59](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/telemetry.js#L59) | Inspeção/limpeza. |
| `toRow()` | [L68](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/telemetry.js#L68) | Mapeia evento → linha de `events`. |
| `flush()` | [L82](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/telemetry.js#L82) | Envia o lote via `supabase-js`. |

**Importa:** [`supabaseClient`](#supabaseclientjs). **Usado por:** [`app.js`](#appjs) (`track`/`flush`) e [`llmClient.js`](#llmclientjs) (`track`).

### `promptCache.js`
[Arquivo](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/promptCache.js) ·
Leitura do cache de respostas ([`prompt_cache`](#banco-de-dados-postgresql)).

| Função | Linha | Descrição |
|---|---|---|
| `hashRequest()` | [L11](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/promptCache.js#L11) | sha256 hex (JSON estável). **Mesmo algoritmo** da Edge Function. |
| `stableStringify()` | [L21](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/promptCache.js#L21) | Serialização determinística. |
| `getCachedResponse()` | [L30](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/promptCache.js#L30) | Lookup por hash (miss = `null`). |

**Importa:** [`supabaseClient`](#supabaseclientjs). **Usado por:** [`llmClient.js`](#llmclientjs).
**Espelho no backend:** [`stableStringify`/`sha256Hex` da Edge Function](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts#L51).

### `llmClient.js`
[Arquivo](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/llmClient.js) ·
Cliente da LLM (cache antes de invocar a Edge Function).

| Função | Linha | Descrição |
|---|---|---|
| `buildLlmEvent()` | [L12](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/llmClient.js#L12) | Monta o evento de telemetria `llm_request`. |
| `newRequestId()` | [L24](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/llmClient.js#L24) | `requestId` (header `x-request-id`). |
| `askLLM()` | [L33](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/llmClient.js#L33) | Cache → `functions.invoke('prompt-llm')` → trata `429`/erros. |

**Importa:** [`supabaseClient`](#supabaseclientjs), [`promptCache`](#promptcachejs), [`telemetry`](#telemetryjs). **Usado por:** [`app.js`](#appjs) (exposto como `window.PE.askLLM`). Chama a [Edge `prompt-llm`](#edge-prompt-llm).

### `generators.js`
[Arquivo](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/generators.js) ·
Geradores declarativos (exemplo testável; usado pelo playground).

| Símbolo | Linha |
|---|---|
| `generatorTemplates` | [L5](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/generators.js#L5) |
| `buildPrompt()` | [L31](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/generators.js#L31) |

**Usado por:** [`app.js`](#appjs) (playground). Testes: [`generators.test.js`](https://github.com/danzeroum/prompte/blob/main/frontend/tests/generators.test.js).

### `auth.js`
[Arquivo](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/auth.js) ·
Login por magic link (Supabase Auth).

| Função | Linha | Descrição |
|---|---|---|
| `currentUser()` / `isLoggedIn()` | [L11](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/auth.js#L11) / [L15](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/auth.js#L15) | Estado atual. |
| `onAuthChange()` | [L20](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/auth.js#L20) | Assina mudanças (usado pelo dashboard). |
| `setUser()` | [L26](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/auth.js#L26) | Atualiza estado + `window.PE.user`. |
| `isValidEmail()` | [L36](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/auth.js#L36) | Valida e-mail. |
| `signInWithEmail()` | [L41](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/auth.js#L41) | `supabase.auth.signInWithOtp`. |
| `signOut()` | [L53](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/auth.js#L53) | Encerra sessão. |
| `initAuth()` | [L61](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/auth.js#L61) | Lê sessão + assina `onAuthStateChange`. |

**Importa:** [`supabaseClient`](#supabaseclientjs). **Usado por:** [`app.js`](#appjs), [`common.js`](#commonjs) (modal), [`admin.js`](#adminjs).

### `metricsClient.js`
[Arquivo](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/metricsClient.js) ·

| Função | Linha | Descrição |
|---|---|---|
| `fetchMetrics()` | [L4](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/metricsClient.js#L4) | `functions.invoke('metrics')`; trata `403`. |

**Importa:** [`supabaseClient`](#supabaseclientjs). **Usado por:** [`admin.js`](#adminjs). Chama a [Edge `metrics`](#edge-metrics).

### `admin.js`
[Arquivo](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/admin.js) ·
Painel do `admin.html`.

| Função | Linha | Descrição |
|---|---|---|
| `esc()` | [L8](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/admin.js#L8) | Escapa HTML. |
| `card()` / `renderMetrics()` | [L12](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/admin.js#L12) / [L16](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/admin.js#L16) | Renderiza cards/tabelas. |
| `mount()` | [L43](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/admin.js#L43) | Em `onAuthChange`, busca e renderiza as métricas. |

**Importa:** [`auth`](#authjs), [`metricsClient`](#metricsclientjs). **Usado por:** [`admin.html`](https://github.com/danzeroum/prompte/blob/main/frontend/admin.html#L13).

---

## Backend — Edge Functions (Deno)

### Edge `prompt-llm`
[Arquivo](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts) ·
Proxy seguro da LLM com cache, rate limiting, fallback e logs.

| Símbolo | Linha | Descrição |
|---|---|---|
| `PROVIDERS` | [L8](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts#L8) | DeepSeek → OpenAI (fallback). |
| `makeLog()` | [L38](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts#L38) | Log JSON com `requestId` (#10). |
| `stableStringify()` / `sha256Hex()` | [L51](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts#L51) / [L59](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts#L59) | **Hash idêntico** ao [`promptCache.hashRequest`](#promptcachejs). |
| `decodeJwt()` / `clientIp()` | [L67](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts#L67) / [L78](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts#L78) | Identidade p/ rate limit. |
| `callLLM()` | [L83](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts#L83) | Fallback entre provedores. |
| `Deno.serve()` | [L123](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts#L123) | Handler: cache → rate limit → LLM → upsert. |

Acessa: [`prompt_cache` (select)](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts#L152), [`consume_rate_limit` (rpc)](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts#L173), [`prompt_cache` (upsert)](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts#L199). Chamado por [`llmClient.askLLM`](#llmclientjs).

### Edge `metrics`
[Arquivo](https://github.com/danzeroum/prompte/blob/main/supabase/functions/metrics/index.ts) ·
Agregações para o dashboard (admin-only).

| Símbolo | Linha | Descrição |
|---|---|---|
| `decodeJwt()` | [L21](https://github.com/danzeroum/prompte/blob/main/supabase/functions/metrics/index.ts#L21) | Lê `role`/`email` do JWT. |
| `Deno.serve()` | [L32](https://github.com/danzeroum/prompte/blob/main/supabase/functions/metrics/index.ts#L32) | Checa `ADMIN_EMAILS` → `403` ou métricas. |
| `rpc('get_metrics')` | [L50](https://github.com/danzeroum/prompte/blob/main/supabase/functions/metrics/index.ts#L50) | Agregações. |

Chamado por [`metricsClient.fetchMetrics`](#metricsclientjs).

---

## Banco de dados (PostgreSQL)

Objetos criados via migrações (aplicadas no projeto Supabase `tqohthmeneaweuozuref`):

| Objeto | Tipo | Escrito por | Lido por |
|---|---|---|---|
| `events` | tabela (RLS write-only) | [`telemetry.flush`](#telemetryjs) (insert anon) | [`get_metrics()`](#edge-metrics) (service_role) |
| `prompt_cache` | tabela (RLS select fresco) | Edge `prompt-llm` ([upsert](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts#L199)) | [`promptCache.getCachedResponse`](#promptcachejs) + Edge ([select](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts#L152)) |
| `rate_limit_hits` | tabela (sem policy) | função `consume_rate_limit` | idem |
| `consume_rate_limit(id,max,window)` | função (sliding window) | — | Edge `prompt-llm` ([L173](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts#L173)) |
| `get_metrics()` | função (agregações) | — | Edge `metrics` ([L50](https://github.com/danzeroum/prompte/blob/main/supabase/functions/metrics/index.ts#L50)) |

> O DDL completo está descrito em [`ROADMAP.md`](./ROADMAP.md) (Fases A, B, D e melhorias).

---

## Páginas HTML e configuração

| Arquivo | Papel |
|---|---|
| [`index.html`](https://github.com/danzeroum/prompte/blob/main/frontend/index.html) | Análise dos 20 ebooks + 6 geradores. Lógica inline `show()`/`genEnhanced()`. |
| [`generator.html`](https://github.com/danzeroum/prompte/blob/main/frontend/generator.html) | 25 templates. Lógica inline `showTemplate()`/`generatePrompt()`. |
| [`manual.html`](https://github.com/danzeroum/prompte/blob/main/frontend/manual.html) | Manual + playground ([`#pe-playground`](https://github.com/danzeroum/prompte/blob/main/frontend/manual.html#L932)). |
| [`admin.html`](https://github.com/danzeroum/prompte/blob/main/frontend/admin.html) | Dashboard ([`#pe-metrics`](https://github.com/danzeroum/prompte/blob/main/frontend/admin.html#L65)) + [`admin.js`](#adminjs). |
| [`theme.css`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/css/theme.css) | Design system (tokens + `.light-theme` + componentes `pe-*`). |
| [`vite.config.js`](https://github.com/danzeroum/prompte/blob/main/frontend/vite.config.js) | Multi-página + PWA. |
| [`netlify.toml`](https://github.com/danzeroum/prompte/blob/main/netlify.toml) | Deploy. |
