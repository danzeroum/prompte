# Prompt Engineering Pro — Explicação ligada ao código

Versão didática **interligada ao código**: cada explicação aponta para onde o
comportamento está implementado. Veja também a
[referência de scripts](./SCRIPTS.md) e o
[grafo de interligação](./ARQUITETURA.md).

> Base dos links: `https://github.com/danzeroum/prompte/blob/main/`
> ℹ️ Notas marcadas com **(estado real)** ajustam o texto à implementação atual.

---

## 1. O que é
Ferramenta web que **gera prompts profissionais**. Em vez de "melhore meu código",
ela monta um prompt rico em contexto. Os geradores de exemplo são declarativos em
[`generators.js`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/generators.js#L5);
a lógica completa dos 25 templates vive inline em
[`generator.html`](https://github.com/danzeroum/prompte/blob/main/frontend/generator.html)
(`generatePrompt()`), e os 6 geradores de domínio em
[`index.html`](https://github.com/danzeroum/prompte/blob/main/frontend/index.html) (`genEnhanced()`).

## 2. Problemas que resolve (e onde isso aparece no código)
| Problema | Onde está |
|---|---|
| Modelos prontos de prompt | [`generator.html`](https://github.com/danzeroum/prompte/blob/main/frontend/generator.html) (templates) · [`generators.js`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/generators.js#L5) (exemplo testável) |
| Conhecimento dos 20 ebooks | dados embutidos em [`index.html`](https://github.com/danzeroum/prompte/blob/main/frontend/index.html) |
| Assistente conversacional (DeepSeek) | [`llmClient.askLLM`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/llmClient.js#L33) → [Edge `prompt-llm`](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts#L123). **(estado real)** exposto via `window.PE.askLLM`; ainda **não há widget de chat** na UI — só o backend e o cliente. |
| Cache de respostas | [`promptCache.js`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/promptCache.js#L30) (cliente) + [upsert na Edge](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts#L199) |
| Rate limiting | [`consume_rate_limit` (rpc)](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts#L173) — 15 anon / 60 autenticado |
| Painel admin | [`admin.html`](https://github.com/danzeroum/prompte/blob/main/frontend/admin.html) + [`admin.js`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/admin.js#L43) + [Edge `metrics`](https://github.com/danzeroum/prompte/blob/main/supabase/functions/metrics/index.ts#L32) |

## 3. Visão geral do funcionamento
- **Frontend** (estático): quatro HTMLs + módulos em [`assets/js/`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js), carregados por [`app.js`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/app.js#L53).
- **Backend** (Supabase): Edge Functions [`prompt-llm`](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts) e [`metrics`](https://github.com/danzeroum/prompte/blob/main/supabase/functions/metrics/index.ts) + Postgres.
- **IA:** DeepSeek (`deepseek-chat`), OpenAI como fallback — [`PROVIDERS`](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts#L8).

## 4. Fluxo de uma requisição
O passo a passo completo, com links para cada etapa, está em
[`ARQUITETURA.md` §3](./ARQUITETURA.md#3-fluxo-de-uma-requisição-de-prompt-passo-a-passo-com-código).
Resumo: `askLLM` → cache local → Edge (cache → rate limit → LLM → cache) → telemetria.

## 5. Fases do desenvolvimento → código
| Fase | Entregável principal | Código |
|---|---|---|
| Fundação | módulos + build | [`app.js`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/app.js) · [`theme.css`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/css/theme.css) · [`vite.config.js`](https://github.com/danzeroum/prompte/blob/main/frontend/vite.config.js) |
| A — Telemetria | tabela `events` + fila | [`telemetry.js`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/telemetry.js#L82) |
| B — Cache | `prompt_cache` | [`promptCache.js`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/promptCache.js#L30) |
| C — LLM | Edge `prompt-llm` | [index.ts](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts#L123) · [`llmClient.js`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/llmClient.js#L33) |
| D — Rate limiting | `consume_rate_limit` | [rpc na Edge](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts#L173) |
| E — Deploy | Netlify | [`netlify.toml`](https://github.com/danzeroum/prompte/blob/main/netlify.toml) |
| D.2 — Login | magic link | [`auth.js`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/auth.js#L41) · modal em [`common.js`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/common.js#L256) |
| Melhorias #6/#7 | sliding window, fallback, logs, dashboard | [`ROADMAP.md`](./ROADMAP.md) + [Edge v3](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts) + [`admin.js`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/admin.js) |

## 6. Segurança e privacidade → onde é garantido
- **Telemetria write-only:** RLS sem `SELECT` (ver [`ROADMAP.md` Fase A](./ROADMAP.md)); o cliente só faz `insert` em [`flush`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/telemetry.js#L82).
- **Cache sem poisoning:** escrita só por `service_role` na [Edge](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts#L199); cliente só lê ([`getCachedResponse`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/promptCache.js#L30)).
- **Chaves:** a anon é pública por design ([`supabaseConfig`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/supabaseClient.js#L9)); a key da LLM fica em `Deno.env` na Edge ([uso](https://github.com/danzeroum/prompte/blob/main/supabase/functions/prompt-llm/index.ts#L83)), nunca no bundle.
- **Admin:** `403` salvo e-mail em `ADMIN_EMAILS` ([handler `metrics`](https://github.com/danzeroum/prompte/blob/main/supabase/functions/metrics/index.ts#L32)).
- **CSP:** `connect-src` restrito a `*.supabase.co` (ex.: [index.html](https://github.com/danzeroum/prompte/blob/main/frontend/index.html#L9)).

## 7. Como rodar
```bash
git clone https://github.com/danzeroum/prompte.git
cd prompte/frontend && npm install && npm run dev   # http://localhost:5173
```
Detalhes e secrets em [`README.md`](../README.md).

## 8. Correções ao texto original **(estado real)**
- **Tema claro/escuro NÃO é "próximo passo" — já existe:** [`theme.js`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/theme.js#L38) + toggle em [`common.js`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/common.js#L80) + [`.light-theme`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/css/theme.css#L49).
- **Internacionalização já tem base** ([`i18n.js`](https://github.com/danzeroum/prompte/blob/main/frontend/assets/js/i18n.js)); falta tagear o conteúdo extenso (ver [`ROADMAP.md`](./ROADMAP.md), itens incrementais).
- **Assistente conversacional:** backend + `window.PE.askLLM` prontos; o **widget de chat na UI** ainda não foi construído (oportunidade futura).
