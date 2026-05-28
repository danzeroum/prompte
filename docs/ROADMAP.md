# Roadmap

A fundação (esta entrega) deixou o frontend modular, acessível, instalável (PWA),
internacionalizável e coberto por testes/CI. As fases seguintes adicionam o backend
sobre **Supabase** (reorientação do plano original de VPS/Docker, que exigia muito mais
operação).

> ℹ️ Projeto Supabase dedicado **`prompt-engineering-pro`**
> (ref `tqohthmeneaweuozuref`, região sa-east-1) criado para este app.

## Fase A — Telemetria ✅ (concluída)
- Tabela `public.events` (`id`, `type`, `session_id`, `user_id`, `payload jsonb`,
  `created_at`) com índices em `created_at` e `type`.
- RLS habilitada: apenas `INSERT` para `anon`/`authenticated`, com `WITH CHECK`
  endurecido (tamanho de `type`/`session_id`, `payload < 10KB`, sem spoofing de
  `user_id`). Sem policy de `SELECT` → write-only do lado do cliente; leitura só
  via `service_role`.
- `assets/js/supabaseClient.js` inicializa o `supabase-js` a partir de
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (import dinâmico, code-split).
- `assets/js/telemetry.js` envia a fila no `flush()` (load, a cada 30s e em
  `visibilitychange: hidden`), removendo só os eventos enviados.
- Verificado: insert válido como `anon` grava; insert inválido é bloqueado pela
  RLS; `anon` não lê.

## Fase B — Cache de prompts ✅ (concluída)
- Tabela `public.prompt_cache` (`hash` PK, `response jsonb`, `created_at`,
  `expires_at`) + índice em `expires_at`.
- RLS: `SELECT` para `anon`/`authenticated` apenas de entradas **não expiradas**
  (`using (expires_at > now())`). **Sem** policy de `INSERT/UPDATE/DELETE` →
  escrita só via `service_role` (Edge Function da Fase C), evitando cache poisoning.
- `assets/js/promptCache.js`: `hashRequest()` (sha256 hex, JSON estável) e
  `getCachedResponse()` (lookup por hash; miss = `null`). Apenas leitura no cliente.
- Verificado: entrada fresca visível ao `anon`, expirada oculta, `anon` não escreve.
- Fluxo (na Fase C): cliente calcula o hash e consulta o cache; se houver hit
  fresco, retorna na hora; senão chama a Edge Function, que grava o cache.

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
