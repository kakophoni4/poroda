#!/usr/bin/env bash
set -euo pipefail
ROOT="/srv/poroda-site"
cd "$ROOT"

# .env без NODE_ENV (development в .env ломает next build и может сбивать runtime)
# HOSTNAME в .env или в shell ломает bind (147.45.224.200:3000 → curl 127.0.0.1 не работает)
unset NODE_ENV HOSTNAME
set -a
# shellcheck disable=SC1091
source "$ROOT/.env"
set +a
unset NODE_ENV HOSTNAME

export NODE_ENV=production
export PORT="${PORT:-3000}"
export HOSTNAME="0.0.0.0"

STANDALONE_DIR="$ROOT/.next/standalone"
STANDALONE_SERVER="$STANDALONE_DIR/server.js"

if [[ -f "$STANDALONE_SERVER" ]]; then
  # Next.js рекомендует запуск из папки standalone
  # env HOSTNAME=… — перебивает stale HOSTNAME из pm2 dump (147.45.224.200:3000)
  cd "$STANDALONE_DIR"
  exec env HOSTNAME="0.0.0.0" NODE_ENV=production PORT="${PORT}" node server.js
fi

echo "[start-prod] ERROR: $STANDALONE_SERVER not found. Run: cd $ROOT && npm run build" >&2
exit 1
