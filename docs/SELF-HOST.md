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

## Modo gateway (atrás de um nginx/Traefik existente)

Se a VPS já tem um **gateway global** fazendo TLS e roteamento (ex.: `btv-nginx-prod`
na rede `btv-prod-net`), **não use o Caddy** deste repo. Use o compose de gateway, que
**não expõe 80/443** e pluga `frontend`/`api` na rede do gateway:

```bash
docker compose --env-file ops/.env.selfhost -f ops/docker-compose.gateway.yml up -d --build
```

No gateway, roteie o domínio para os containers (`prompte-frontend:80` e `prompte-api:8787`).
Exemplo de bloco nginx (o `^~ /api/` precede o regex de bloqueio e o `location /`):

```nginx
server { listen 443 ssl; server_name prompte.buildtovalue.cloud;
    ssl_certificate     /etc/letsencrypt/live/prompte.buildtovalue.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/prompte.buildtovalue.cloud/privkey.pem;
    add_header Strict-Transport-Security "max-age=63072000" always;
    location ~* (wp-login|login\.cgi|\.git|env) { return 444; }
    location ^~ /api/ { set $up_api "http://prompte-api:8787"; proxy_pass $up_api; }
    location /       { set $upstream "http://prompte-frontend:80"; proxy_pass $upstream; } }
```

## Backup e restore

O serviço `db-backup` roda `pg_dump` comprimido a cada `BACKUP_INTERVAL_SECONDS`
(default 1 dia), mantendo os últimos `BACKUP_KEEP` (default 7) no volume `db_backups`.

```bash
# listar/baixar backups
docker compose -f ops/docker-compose.selfhost.yml exec db-backup ls -1t /backups
docker compose -f ops/docker-compose.selfhost.yml cp db-backup:/backups/<arquivo>.sql.gz ./

# restaurar um dump (recria o schema e reaplica)
gunzip -c <arquivo>.sql.gz | \
  docker compose -f ops/docker-compose.selfhost.yml exec -T db \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

> Para forçar um backup imediato: `docker compose ... restart db-backup` (ele dumpa ao subir).

