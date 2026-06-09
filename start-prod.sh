#!/usr/bin/env bash
set -euo pipefail
cd /srv/poroda-site

# Подтягиваем .env (DATABASE_URL, SESSION_SECRET, …). NODE_ENV сюда НЕ кладём —
# Next.js сам выставляет production при build/start; development в .env ломает next build.
set -a
# shellcheck disable=SC1091
. /srv/poroda-site/.env
set +a

# После .env — всегда production на проде (даже если в .env случайно NODE_ENV=development).
export NODE_ENV=production
export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"

exec node /srv/poroda-site/.next/standalone/server.js
