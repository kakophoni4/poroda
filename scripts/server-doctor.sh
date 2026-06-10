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
ls -la .next/prerender-manifest.json 2>/dev/null || echo "✗ Нет .next/prerender-manifest.json — сборка неполная, rm -rf .next && npm run build"
ls -la public/uploads 2>/dev/null || echo "public/uploads: нет (нормально, если UPLOAD_DIR + postbuild)"
grep '^HOSTNAME=' .env 2>/dev/null && echo "⚠ Удалите HOSTNAME из .env — ломает bind: sed -i '/^HOSTNAME=/d' .env"
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
health_ok=0
for url in http://127.0.0.1:3000/api/health http://[::1]:3000/api/health; do
  code=$(curl -s -m 5 -o /tmp/poroda-health.txt -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  echo "$url → HTTP $code"
  if [[ "$code" == "200" ]]; then
    health_ok=1
    head -c 200 /tmp/poroda-health.txt 2>/dev/null; echo
    break
  fi
done
if [[ "$health_ok" -eq 0 ]]; then
  bind=$(ss -tlnp 2>/dev/null | grep ':3000 ' | head -1)
  if [[ -n "$bind" ]]; then
    echo "⚠ Порт 3000 слушает не на 127.0.0.1 (часто HOSTNAME в .env). Bind: $bind"
    echo "  fix: sed -i '/^HOSTNAME=/d' .env && pm2 restart poroda"
  else
    echo "✗ Ничего не отвечает на :3000"
  fi
fi
echo ""

echo "--- last pm2 errors ---"
pm2 logs poroda --lines 15 --nostream 2>/dev/null | tail -20
