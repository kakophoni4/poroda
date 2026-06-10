#!/usr/bin/env bash
# Быстрая диагностика 502 на VPS. Запуск: bash scripts/server-doctor.sh
set -u
cd /srv/poroda-site 2>/dev/null || cd "$(dirname "$0")/.."

echo "=== poroda server doctor ==="
echo "cwd: $(pwd)"
echo ""

echo "--- .env (ключи, без секретов) ---"
grep -E '^(DATABASE_URL|SESSION_SECRET|NEXT_PUBLIC_SITE_URL|UPLOAD_DIR|NODE_ENV)=' .env 2>/dev/null | sed 's/SESSION_SECRET=.*/SESSION_SECRET=***/' | sed 's/DATABASE_URL=postgresql:\/\/[^@]*@/DATABASE_URL=postgresql:\/\/***@/' || echo ".env не найден"
grep '^NODE_ENV=' .env && echo "⚠ Удалите NODE_ENV из .env: sed -i '/^NODE_ENV=/d' .env"
echo ""

echo "--- build artifacts ---"
ls -la .next/standalone/server.js 2>/dev/null || echo "✗ Нет .next/standalone/server.js — нужен npm run build"
ls -la public/uploads 2>/dev/null || echo "public/uploads: нет (нормально, если UPLOAD_DIR + postbuild)"
echo ""

echo "--- pm2 ---"
pm2 status poroda 2>/dev/null || echo "pm2: процесс poroda не найден"
echo ""

echo "--- port 3000 ---"
if command -v ss >/dev/null; then
  ss -tlnp | grep ':3000 ' || echo "✗ Ничего не слушает :3000"
elif command -v netstat >/dev/null; then
  netstat -tlnp 2>/dev/null | grep ':3000 ' || echo "✗ Ничего не слушает :3000"
fi
echo ""

echo "--- local health ---"
curl -s -m 5 -o /tmp/poroda-health.txt -w "HTTP %{http_code}\n" http://127.0.0.1:3000/api/health || echo "curl failed"
head -c 200 /tmp/poroda-health.txt 2>/dev/null; echo
echo ""

echo "--- last pm2 errors ---"
pm2 logs poroda --lines 15 --nostream 2>/dev/null | tail -20
