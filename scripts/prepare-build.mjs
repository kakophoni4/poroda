/**
 * Перед `next build`: убираем public/uploads, если это симлинк на UPLOAD_DIR вне проекта.
 * Turbopack падает: "Symlink ... points out of the filesystem root".
 * Файлы в /var/poroda/uploads не трогаем — удаляется только ссылка в public/.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uploadsPublic = path.join(root, "public", "uploads");

if (!fs.existsSync(uploadsPublic)) {
  process.exit(0);
}

const stat = fs.lstatSync(uploadsPublic);
if (stat.isSymbolicLink()) {
  fs.unlinkSync(uploadsPublic);
  console.log("[prepare-build] Removed public/uploads symlink (safe for Turbopack). Files on disk unchanged.");
}
