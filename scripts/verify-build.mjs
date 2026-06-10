/**
 * Проверка артефактов после next build + postbuild. Падает, если сборка неполная.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const required = [
  ".next/prerender-manifest.json",
  ".next/standalone/server.js",
  ".next/standalone/.next/BUILD_ID",
];

const missing = required.filter((rel) => !fs.existsSync(path.join(root, rel)));

if (missing.length) {
  console.error("[verify-build] ✗ Неполная сборка. Нет файлов:");
  for (const f of missing) console.error(`  - ${f}`);
  console.error("[verify-build] Попробуйте: rm -rf .next && npm run build");
  process.exit(1);
}

console.log("[verify-build] ✓ build artifacts OK");
