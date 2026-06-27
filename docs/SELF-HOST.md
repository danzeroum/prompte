# Self-host na VPS (Postgres puro + backend próprio, tudo via Docker)

Pilha 100% self-contained, sem Supabase: **Postgres + API (Node/Fastify) + frontend
(nginx) + Caddy (HTTPS)**, orquestrada por um único `docker compose`.

```
navegador ──HTTPS──▶ Caddy ──/ ───────▶ frontend (nginx, dist estático)
                          └──/api/* ───▶ api (Fastify) ──▶ db (Postgres 16)
```

## Pré-requisitos

- VPS com Docker + Docker Compose, portas 80/443 livres.
- Registro DNS **A** do seu domínio apontando para o IP da VPS.

## Passos

```bash
# 1) configure o ambiente
cp ops/.env.selfhost.example ops/.env.selfhost
# edite ops/.env.selfhost: POSTGRES_*, JWT_SECRET (openssl rand -hex 32),
# ADMIN_EMAILS, DOMAIN, ACME_EMAIL e (opcional) DEEPSEEK_API_KEY/OPENAI_API_KEY

# 2) suba tudo (build do frontend e da API inclusos)
docker compose --env-file ops/.env.selfhost -f ops/docker-compose.selfhost.yml up -d --build

# 3) acompanhe
docker compose --env-file ops/.env.selfhost -f ops/docker-compose.selfhost.yml ps
docker compose --env-file ops/.env.selfhost -f ops/docker-compose.selfhost.yml logs -f api
```

O **schema do banco é aplicado automaticamente** no primeiro boot (scripts em
`db/init/` rodam quando o volume está vazio — "banco limpo"). Para recriar do zero:
`docker compose ... down -v` (apaga o volume `db_data`) e suba de novo.

## Serviços

| Serviço | Imagem | Papel | Exposto? |
|---|---|---|---|
| `db` | postgres:16-alpine | banco | só rede interna |
| `api` | build `api/` | auth + dados + LLM + métricas (`/api/*`) | só rede interna |
| `frontend` | build `frontend/` | estático (nginx) | só rede interna |
| `caddy` | caddy:2-alpine | TLS + roteamento | **80/443** |

## Variáveis (ops/.env.selfhost)

| Var | Para quê |
|---|---|
| `POSTGRES_USER/PASSWORD/DB` | credenciais do Postgres |
| `JWT_SECRET` | assinatura dos JWT (**obrigatório**) |
| `ADMIN_EMAILS` | CSV de e-mails que acessam `/api/metrics` |
| `DEEPSEEK_API_KEY` / `OPENAI_API_KEY` | LLM (sem chave → `/api/llm` responde 503) |
| `DOMAIN` / `ACME_EMAIL` | HTTPS automático (Let's Encrypt) |

## Verificação ponta a ponta

1. `https://SEU_DOMINIO/api/health` → `{"ok":true}`.
2. Abra o site → **Conta → Criar conta** (e-mail + senha) → loga e fecha o modal.
3. Gere um prompt e **Salvar** → vai para o Postgres (não localStorage).
4. (Com chave de LLM) use o chat/IA → resposta + cache.
5. Entre com um e-mail de `ADMIN_EMAILS` → a página **Admin/Métricas** carrega.

> Dev local (sem Docker): `cd api && npm i && DATABASE_URL=... JWT_SECRET=dev npm start`
> e `cd frontend && npm run dev` (o Vite proxia `/api` → `http://localhost:8787`).
