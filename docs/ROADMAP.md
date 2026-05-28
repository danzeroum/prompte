# Roadmap

A fundação (esta entrega) deixou o frontend modular, acessível, instalável (PWA),
internacionalizável e coberto por testes/CI. As fases seguintes adicionam o backend
sobre **Supabase** (reorientação do plano original de VPS/Docker, que exigia muito mais
operação).

> ⚠️ **Pré-requisito:** o único projeto Supabase conectado a este ambiente é
> `familia-em-equilibrio` (ref `pdtmlzmtvngmgwhwivxf`, região sa-east-1) e está
> **INACTIVE (pausado)**. O nome não corresponde a este app. Antes da Fase A, confirmar
> se este é o projeto correto (ou criar um novo) e reativá-lo.

## Fase A — Telemetria
- Tabela `events` (`type`, `session_id`, `user_id`, `payload jsonb`, `created_at`).
- RLS permitindo apenas `insert` anônimo.
- `assets/js/telemetry.js` passa a usar `supabase-js` (anon key) no `flush()`.
- Substitui o antigo endpoint `POST /api/event`.

## Fase B — Cache de prompts
- Tabela `prompt_cache` (`hash unique`, `response jsonb`, `expires_at`).
- Lookup por hash antes de chamar a LLM.

## Fase C — Integração LLM
- **Edge Function** como proxy do provedor LLM (DeepSeek ou outro).
- API key guardada como **secret** do Supabase (nunca no cliente).
- Cache via tabela da Fase B; retry + timeout.
- Substitui o serviço Express `callDeepSeek` do plano original.

## Fase D — Autenticação e rate limiting
- Supabase Auth + RLS por usuário.
- Rate limiting na Edge Function (por usuário/IP).
- `telemetry` passa a preencher `userId`.

## Fase E — Deploy
- Publicar `frontend/dist` em hosting estático (Supabase Storage ou Netlify).
- `public/_headers` já define o cache correto (assets imutáveis, HTML `no-cache`).
- Dispensa nginx/Docker/Prometheus do plano original.

## Itens incrementais de frontend
- Completar a marcação `data-i18n` no conteúdo das três páginas (hoje a "chrome" está
  traduzida; o conteúdo extenso é incremental).
- Migrar progressivamente a lógica inline de geração para módulos `generators.js`
  testáveis (já iniciado com `review`/`api`).
