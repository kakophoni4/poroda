import path from "node:path";

/**
 * Корень для загружаемых файлов.
 *
 * - Локально/по умолчанию — `public/uploads` рядом с проектом
 *   (отдаётся Next напрямую как статика).
 * - На VPS лучше задать `UPLOAD_DIR=/var/poroda/uploads` (или иной постоянный путь),
 *   а сам путь подключить к веб-серверу — двумя способами:
 *
 *   1) nginx alias (рекомендуется):
 *   2) postbuild создаёт симлинк `.next/standalone/public/uploads` → UPLOAD_DIR.
 *      Не делайте симлинк `public/uploads` в корне — ломает `next build` (Turbopack).
 *
 *   nginx alias:
 *        location /uploads/ { alias /var/poroda/uploads/; }
 *      В этом случае Next к /uploads вообще не обращается.
 *
 * При деплое через `output: "standalone"` Next пересобирает `.next/standalone/public`
 * на каждом ребилде — поэтому хранение uploads ВНЕ папки сборки обязательно,
 * иначе при следующем `npm run build` загруженные заказчиком фото исчезнут.
 */
export function getUploadRoot(): string {
  const fromEnv = process.env.UPLOAD_DIR?.trim();
  if (fromEnv) return path.isAbsolute(fromEnv) ? fromEnv : path.resolve(process.cwd(), fromEnv);
  return path.join(process.cwd(), "public", "uploads");
}

/** Безопасная склейка относительного пути с UPLOAD_ROOT (защита от path traversal). */
export function resolveUploadPath(...segments: string[]): string {
  const root = getUploadRoot();
  const joined = path.resolve(root, ...segments);
  if (!joined.startsWith(root + path.sep) && joined !== root) {
    throw new Error("Invalid upload path");
  }
  return joined;
}
