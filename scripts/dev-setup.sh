#!/usr/bin/env bash
# Setup do harness de IA / dev — execução MANUAL (não é um hook auto-executável).
# Deixa o repo pronto para rodar testes/lint/build: instala as dependências do
# frontend. Idempotente: se node_modules já existe, sai rápido.
#
# Uso:  bash scripts/dev-setup.sh
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root/frontend"

if [ ! -d node_modules ]; then
  echo "[dev-setup] instalando dependências do frontend…"
  npm ci --no-audit --no-fund || npm install --no-audit --no-fund
else
  echo "[dev-setup] node_modules já presente — nada a fazer."
fi

echo "[dev-setup] pronto. node $(node -v 2>/dev/null || echo '?')."
