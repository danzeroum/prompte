# Harness de IA (MCP: GitHub + Supabase)

Este repositório pode ser operado por uma sessão de IA (Claude Code web/CLI) como um
**harness**: a IA acessa os diretórios, roda testes/lint/build e interage com GitHub e
Supabase via **MCP (Model Context Protocol)**.

## Componentes

| Arquivo | Papel | Ativação |
|---|---|---|
| `.mcp.json` | Declara os servidores MCP `github` e `supabase` | Versionado. O Claude pede aprovação no 1º uso (padrão seguro). |
| `.claude/settings.example.json` | Template de permissões + auto-aprovação + SessionStart hook | **Inerte.** Copie para `.claude/settings.json` para ativar. |
| `scripts/dev-setup.sh` | Instala dependências do frontend (idempotente) | Execução manual: `bash scripts/dev-setup.sh`. |

> Os arquivos que concedem permissões elevadas ao agente (`.claude/settings.json`) e o hook
> que roda automaticamente **não são criados/ativados automaticamente** — é um passo manual
> e deliberado seu, por segurança.

## Servidores MCP

### GitHub (`github`)
- Transporte: HTTP remoto (`https://api.githubcopilot.com/mcp/`). Autentica via OAuth no
  primeiro uso.
- Alternativa (token/Docker): trocar o bloco por
  ```json
  "github": {
    "command": "docker",
    "args": ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
             "ghcr.io/github/github-mcp-server"],
    "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}" }
  }
  ```
- Usos: ler/abrir PRs e issues, ver CI (Actions), buscar código.

### Supabase (`supabase`)
- Roda via `npx @supabase/mcp-server-supabase` em modo `--read-only`, fixado ao projeto
  `tqohthmeneaweuozuref`.
- Requer o segredo `SUPABASE_ACCESS_TOKEN` no ambiente (ver `.env.harness.example`).
- Remova `--read-only` apenas quando for aplicar migrações conscientemente.
- Usos: `get_logs` (debug de auth/edge functions), `list_tables`, `get_advisors`.

## Como ativar (passo a passo)

1. Forneça os segredos no ambiente da sessão (não commitar):
   - `SUPABASE_ACCESS_TOKEN` — token pessoal do Supabase.
   - `GITHUB_PERSONAL_ACCESS_TOKEN` — só se optar pelo GitHub MCP via Docker.
2. (Opcional) Ative as permissões e o setup automático:
   `cp .claude/settings.example.json .claude/settings.json` e revise o conteúdo.
3. Prepare o repo: `bash scripts/dev-setup.sh` (ou deixe o SessionStart hook fazer).
4. Abra a sessão de IA. Confirme que os MCP `github` e `supabase` sobem sem erro.

## Fluxo de trabalho típico do harness

`explorar diretórios → editar → npm test / npm run lint → commit → abrir/atualizar PR via GitHub MCP`

Para a arquitetura da aplicação em si, ver [`ARQUITETURA.md`](./ARQUITETURA.md).
