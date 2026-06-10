#!/usr/bin/env bash
set -euo pipefail
cd /srv/poroda-site

# Подтягиваем .env (DATABASE_URL, SESSION_SECRET, …). NODE_ENV сюда НЕ кладём —
# Next.js сам выставляет production при build/start; development в .env ломает next build.
# NODE_ENV из .env не подхватываем — development в .env ломает next build.
unset NODE_ENV
set -a
# shellcheck disable=SC1091
. /srv/poroda-site/.env
set +a
unset NODE_ENV

export NODE_ENV=production
export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"

STANDALONE_SERVER="/srv/poroda-site/.next/standalone/server.js"
if [[ -f "$STANDALONE_SERVER" ]]; then
  exec node "$STANDALONE_SERVER"
fi

echo "[start-prod] .next/standalone/server.js not found — falling back to next start" >&2
exec npm run start -- --hostname "${HOSTNAME}" --port "${PORT}"
