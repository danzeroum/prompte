# Prompt Engineering Pro

Ferramenta web (offline-first) de **análise de domínios** e **geração de prompts** de
engenharia de software, composta por três páginas:

| Página | Arquivo | Propósito |
|---|---|---|
| Análise & Gerador | `frontend/index.html` | Análise de 20 ebooks + 6 geradores avançados de prompt |
| Gerador de Prompts | `frontend/generator.html` | 25 templates práticos em 4 categorias |
| Manual | `frontend/manual.html` | Guia completo de uso + playground interativo |

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

Configuração (a chave publishable é pública por design; a proteção é a RLS):

```bash
cd frontend
cp .env.example .env   # já contém URL + publishable key do projeto
```

Variáveis lidas pelo Vite:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Sem `.env`, a aplicação funciona normalmente — apenas não envia telemetria.

## Backend (próximas fases)

As fases B–E (cache de prompts, integração LLM via Edge Function, auth, deploy)
estão descritas em [`docs/ROADMAP.md`](docs/ROADMAP.md).
