# Prompt Engineering Pro

Ferramenta web (offline-first) de **análise de domínios** e **geração de prompts** de
engenharia de software, composta por três páginas:

| Página | Arquivo | Propósito |
|---|---|---|
| Análise & Gerador | `frontend/index.html` | Análise de 20 ebooks + 6 geradores avançados de prompt |
| Gerador de Prompts | `frontend/generator.html` | 25 templates práticos em 4 categorias |
| Manual | `frontend/manual.html` | Guia completo de uso + playground interativo |

## 📚 Documentação detalhada
- [`docs/SCRIPTS.md`](docs/SCRIPTS.md) — referência clicável de **todos os scripts** (cada função com link para a definição).
- [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) — **interligação** entre os scripts (grafo de dependências + fluxos).
- [`docs/EXPLICACAO-CODIGO.md`](docs/EXPLICACAO-CODIGO.md) — explicação didática **ligada ao código**.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — fases e decisões de backend.

## Arquitetura do frontend

As três páginas compartilham um **design system** (`frontend/assets/css/theme.css`) e um
conjunto de **módulos ES** carregados de forma não invasiva por `assets/js/app.js`:

- `theme.js` — tema claro/escuro (respeita `prefers-color-scheme`, persiste a escolha)
- `i18n.js` — internacionalização via `data-i18n` (pt completo, en em expansão)
- `validation.js` — validação de campos obrigatórios + toasts
- `preferences.js` — preferências em `localStorage` (export/import)
- `telemetry.js` — fila local de eventos (contrato para o Supabase — ver roadmap)
- `common.js` — acessibilidade da navegação + controles de topbar
- `generators.js` — geradores declarativos (usados pelo playground e testes)

A lógica de navegação e geração específica de cada página permanece em seus `<script>`
inline; os módulos apenas a enriquecem (tema, a11y, validação, i18n, telemetria).

## Desenvolvimento

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173/index.html
```

## Build e preview

```bash
npm run build     # gera frontend/dist (minificado + service worker PWA)
npm run preview   # serve o build em http://localhost:4173
```

## Qualidade

```bash
npm run lint      # ESLint + Prettier (check)
npm run format    # Prettier (write)
npm test          # Jest + jsdom
```

A CI (`.github/workflows/validate.yml`) roda lint, testes e build a cada push.

## PWA

A aplicação é instalável (manifest em `frontend/public/manifest.json`) e funciona offline
após o primeiro carregamento, via service worker gerado pelo `vite-plugin-pwa` no build.

## Telemetria (Supabase — Fase A ✅)

A telemetria envia eventos para a tabela `events` de um projeto Supabase
(`prompt-engineering-pro`). É offline-first: eventos são enfileirados em
`localStorage` e enviados em lote (`flush`) no load, a cada 30s e ao sair da página.

Configuração (a chave anon é pública por design; a proteção é a RLS):

```bash
cd frontend
cp .env.example .env   # já contém URL + chave anon do projeto
```

Variáveis lidas pelo Vite:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (chave anon **legacy/JWT** — exigida pela Edge Function
  `prompt-llm`, que usa `verify_jwt`)

Sem `.env`, a aplicação funciona normalmente — apenas não envia telemetria.

## Cache de prompts (Supabase — Fase B ✅)

Tabela `prompt_cache` (leitura pública só de entradas frescas; escrita só via
`service_role`). O cliente lê via `assets/js/promptCache.js` antes de chamar a LLM.

## Integração LLM (Supabase Edge Function — Fase C ✅)

`supabase/functions/prompt-llm/index.ts` é um proxy seguro para o **DeepSeek**
(`deepseek-chat`) com cache no Postgres. O cliente usa `assets/js/llmClient.js`
(`askLLM(messages, temperature)`), que tenta o cache antes de invocar a função.

**Falta um passo para funcionar de ponta a ponta:** definir o secret da API key.

```bash
# via CLI:
supabase secrets set DEEPSEEK_API_KEY=sk-...   --project-ref tqohthmeneaweuozuref
# ou pelo Dashboard: Project Settings → Edge Functions → Secrets
```

Sem o secret, a função responde `503 { error: "LLM não configurada..." }`.

## Rate limiting (Supabase — Fase D ✅)

A Edge Function aplica rate limiting por janela fixa de 10 min antes de chamar a
LLM (cache hits não contam): **15 req** para anônimos e **60 req** para usuários
autenticados (id por IP ou `sub` do JWT). Excedido o limite, responde `429` com
`Retry-After`; o cliente expõe `error.status`/`error.rateLimited`/`error.resetAt`.

Implementado via tabela `rate_limit_counters` + função atômica
`consume_rate_limit()` (acesso só por `service_role`).

> Login de usuário (magic link) para destravar o limite maior é opcional e ainda
> não tem UI — a infraestrutura já é *auth-aware*. Ver `docs/ROADMAP.md`.

## Deploy (Fase E ✅ — config pronta)

O repositório está pronto para deploy estático no **Netlify** via `netlify.toml`
(`base = frontend`, `npm run build`, `publish = dist`, env `VITE_*` públicas).
Passo manual: conectar `danzeroum/prompte` no Netlify (Add new site → Import) —
a config é detectada e o deploy roda a cada push na `main`. O `dist/_headers`
cuida do cache. Alternativas: Vercel ou Supabase Storage.

## Dashboard administrativo (#5 ✅)

`admin.html` mostra métricas de telemetria (eventos, chamadas LLM, cache hit rate,
rate limited, erros, por tipo/dia). Acesso restrito: a Edge Function `metrics`
exige usuário autenticado cujo e-mail esteja no secret `ADMIN_EMAILS`.

```bash
supabase secrets set ADMIN_EMAILS=voce@exemplo.com --project-ref tqohthmeneaweuozuref
```
Depois, entre com esse e-mail (magic link) e abra `/admin.html`. Sem o secret,
ninguém é admin (403).

## Login via magic link (Fase D.2 ✅)

Usuários podem entrar com e-mail (magic link) pelo menu de preferências (seção
**Conta**). Uma vez autenticados, o JWT é anexado às chamadas e o limite de rate
limiting sobe (60 vs 15 por 10 min). Implementado em `assets/js/auth.js`.

**Config manual no Supabase:** Authentication → URL Configuration → adicionar as
Redirect URLs (ex.: `http://localhost:5173` e a URL do Netlify). O e-mail padrão
do Supabase tem limite baixo; para produção, configure SMTP.
