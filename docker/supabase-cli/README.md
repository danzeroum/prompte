# Supabase CLI via Docker

Gerencia secrets/migrations de um ou mais projetos Supabase **sem instalar o CLI
global** na VPS. Cada projeto é referenciado pelo seu `--project-ref`.

> Projeto deste app: `tqohthmeneaweuozuref`.

## 1. Build da imagem (uma vez)

```bash
cd docker/supabase-cli
docker build -t supabase-cli .
```

## 2. Autenticação — use um Personal Access Token (recomendado)

Gere em **Supabase Dashboard → Account → Access Tokens** e exporte:

```bash
export SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxx
```

Com PAT via env **não** é preciso `supabase login`, volume `.supabase` nem
`supabase link`. O token fica só na memória do processo (não toca o disco).

## 3. Definir os secrets do projeto

```bash
docker run --rm -e SUPABASE_ACCESS_TOKEN \
  supabase-cli secrets set \
    DEEPSEEK_API_KEY=sk-NOVA_CHAVE \
    ADMIN_EMAILS='danniellau@gmail.com' \
    --project-ref tqohthmeneaweuozuref

# (opcional) fallback OpenAI:
docker run --rm -e SUPABASE_ACCESS_TOKEN \
  supabase-cli secrets set OPENAI_API_KEY=sk-... --project-ref tqohthmeneaweuozuref
```

## 4. Conferir

```bash
docker run --rm -e SUPABASE_ACCESS_TOKEN \
  supabase-cli secrets list --project-ref tqohthmeneaweuozuref
```

## Alternativa: docker compose

```bash
export SUPABASE_ACCESS_TOKEN=sbp_xxx
docker compose run --rm supabase-cli secrets list --project-ref tqohthmeneaweuozuref
```

## Vários projetos
Repita os comandos trocando `--project-ref`. Cada projeto pode usar um PAT
diferente (basta reexportar `SUPABASE_ACCESS_TOKEN`).

---

🔐 **A chave DeepSeek exposta no chat deve ser rotacionada** antes do uso em
produção: gere uma nova em <https://platform.deepseek.com/api_keys>, revogue a
antiga e use a nova nos comandos acima.

ℹ️ Para o **magic link** funcionar, adicione as Redirect URLs em
**Authentication → URL Configuration** (ex.: `http://localhost:5173` e a URL de produção).
