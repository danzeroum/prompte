# Deploy na VPS — frontend + domínio + HTTPS

Serve o **frontend estático** na sua VPS com **HTTPS automático** (Caddy + Let's
Encrypt). O **Supabase continua na nuvem** — nenhum backend roda na VPS; o
navegador fala direto com o Supabase. Por isso o deploy é só "servir arquivos".

> Arquivos usados: [`ops/docker-compose.vps.yml`](../ops/docker-compose.vps.yml),
> [`ops/Caddyfile`](../ops/Caddyfile), [`ops/.env.example`](../ops/.env.example),
> [`frontend/Dockerfile`](../frontend/Dockerfile).

## Pré-requisitos
- VPS Ubuntu 22.04+ com acesso root/sudo.
- Um **domínio** (ex.: `prompt.seudominio.com`) com registro **DNS A** apontando
  para o **IP da VPS** (configure isso no seu provedor de DNS antes de começar —
  o Caddy só emite o certificado quando o domínio resolve para a VPS).

## Passo 1 — Docker
```bash
ssh root@SEU_IP_DA_VPS
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo apt install -y docker-compose-plugin
docker --version && docker compose version
```

## Passo 2 — Clonar o repositório
```bash
sudo mkdir -p /opt/prompte && sudo chown $USER:$USER /opt/prompte
git clone https://github.com/danzeroum/prompte.git /opt/prompte
cd /opt/prompte
```

## Passo 3 — Firewall (UFW)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable && sudo ufw status verbose
```
> A porta 80 é necessária para o desafio HTTP-01 do Let's Encrypt e redireciona
> automaticamente para 443.

## Passo 4 — Configurar domínio e e-mail
```bash
cp ops/.env.example ops/.env
nano ops/.env      # preencha DOMAIN e ACME_EMAIL
```

## Passo 5 — Subir (build + HTTPS automático)
```bash
docker compose --env-file ops/.env -f ops/docker-compose.vps.yml up -d --build
docker compose --env-file ops/.env -f ops/docker-compose.vps.yml ps
```
Esperado: 2 contêineres `running` (`frontend` e `caddy`). O Caddy emite o
certificado sozinho na primeira subida (pode levar alguns segundos).

Acesse: **`https://SEU_DOMINIO`** 🎉

## Passo 6 — Liberar o login (magic link) para o domínio
No **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**,
adicione:
```
https://SEU_DOMINIO/**
```
Sem isso, o login por magic link não retorna para o site em produção. (O resto —
telemetria, cache, LLM, dashboard — já funciona assim que os secrets estiverem
definidos; veja [`docker/supabase-cli/README.md`](../docker/supabase-cli/README.md).)

## Atualizar (redeploy)
```bash
cd /opt/prompte && git pull
docker compose --env-file ops/.env -f ops/docker-compose.vps.yml up -d --build
```

## Ciclo de vida
| Operação | Comando |
|---|---|
| Subir | `docker compose --env-file ops/.env -f ops/docker-compose.vps.yml up -d --build` |
| Logs do Caddy | `docker compose -f ops/docker-compose.vps.yml logs -f caddy` |
| Logs do frontend | `docker compose -f ops/docker-compose.vps.yml logs -f frontend` |
| Parar | `docker compose -f ops/docker-compose.vps.yml down` |
| Parar apagando os certs | `docker compose -f ops/docker-compose.vps.yml down -v` (re-emite TLS no próximo up) |

## Solução de problemas
| Sintoma | Causa provável | Solução |
|---|---|---|
| TLS não emite / erro ACME | DNS ainda não propagou ou porta 80 fechada | Confirme `dig +short SEU_DOMINIO` = IP da VPS; UFW permitindo 80/443 |
| `bind: address already in use` (80/443) | Nginx/Apache do host ativo | `sudo systemctl stop nginx apache2 && sudo systemctl disable nginx apache2` |
| Página abre mas login não volta | Redirect URL ausente | Adicionar `https://SEU_DOMINIO/**` no Supabase Auth (Passo 6) |
| LLM responde 503 | Secret ausente | Definir `DEEPSEEK_API_KEY` (ver `docker/supabase-cli/`) |

## Notas de segurança
- O container `frontend` **não publica porta no host** (`expose`, não `ports`) —
  só o Caddy fica exposto (80/443). Superfície mínima.
- Os certificados ficam no volume `caddy_data` (persistem entre deploys; não use
  `down -v` em produção sem necessidade).
- O `.env` de produção (`ops/.env`) é ignorado pelo Git (só `ops/.env.example` é versionado).
