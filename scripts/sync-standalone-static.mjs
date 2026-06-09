/**
 * После `next build` с output: "standalone" статика лежит в .next/static у корня,
 * а server.js из .next/standalone ищет файлы в .next/standalone/.next/static — без копирования CSS/JS дают 404.
 *
 * public/ копируется ЦЕЛИКОМ — кроме public/uploads. Загруженные пользователем файлы
 * не должны участвовать в деплойной сборке: они подключаются на проде симлинком
 * или nginx alias на постоянную папку (UPLOAD_DIR в .env).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");

if (!fs.existsSync(standalone)) {
  console.warn(
    "[sync-standalone-static] .next/standalone missing — standalone output was not produced. " +
      "Deploy will use `next start` instead of .next/standalone/server.js."
  );
  process.exit(0);
}

function cpDir(srcRel, destRel, opts = {}) {
  const from = path.join(root, srcRel);
  const to = path.join(root, destRel);
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, {
    recursive: true,
    force: true,
    ...opts,
  });
}

cpDir(path.join(".next", "static"), path.join(".next", "standalone", ".next", "static"));

/** Копируем public/ полностью, но без uploads — он живёт на постоянном диске VPS. */
const publicSrc = path.join(root, "public");
const publicDest = path.join(standalone, "public");
fs.mkdirSync(publicDest, { recursive: true });
fs.cpSync(publicSrc, publicDest, {
  recursive: true,
  force: true,
  filter: (src) => {
    const rel = path.relative(publicSrc, src);
    if (rel === "uploads" || rel.startsWith(`uploads${path.sep}`) || rel.startsWith("uploads/")) {
      return false;
    }
    return true;
  },
});
