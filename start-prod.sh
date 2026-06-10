#!/usr/bin/env bash
set -euo pipefail
ROOT="/srv/poroda-site"
cd "$ROOT"

# .env без NODE_ENV (development в .env ломает next build и может сбивать runtime)
unset NODE_ENV
set -a
# shellcheck disable=SC1091
source "$ROOT/.env"
set +a
unset NODE_ENV

export NODE_ENV=production
export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"

STANDALONE_DIR="$ROOT/.next/standalone"
STANDALONE_SERVER="$STANDALONE_DIR/server.js"

if [[ -f "$STANDALONE_SERVER" ]]; then
  # Next.js рекомендует запуск из папки standalone
  cd "$STANDALONE_DIR"
  exec node server.js
fi

echo "[start-prod] ERROR: $STANDALONE_SERVER not found. Run: cd $ROOT && npm run build" >&2
cd "$ROOT"
exec npm run start -- --hostname "${HOSTNAME}" --port "${PORT}"
