/**
 * После сборки standalone: симлинк .next/standalone/public/uploads → UPLOAD_DIR,
 * чтобы runtime отдавал /uploads/* без nginx alias.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
config({ path: path.join(root, ".env") });

const uploadDir = process.env.UPLOAD_DIR?.trim();
if (!uploadDir) {
  process.exit(0);
}

const absUpload = path.isAbsolute(uploadDir) ? uploadDir : path.resolve(root, uploadDir);
if (!fs.existsSync(absUpload)) {
  console.warn(`[link-uploads] UPLOAD_DIR does not exist yet: ${absUpload}`);
  fs.mkdirSync(absUpload, { recursive: true });
}

const standalone = path.join(root, ".next", "standalone");
if (!fs.existsSync(standalone)) {
  process.exit(0);
}

const publicDir = path.join(standalone, "public");
fs.mkdirSync(publicDir, { recursive: true });

const linkPath = path.join(publicDir, "uploads");
if (fs.existsSync(linkPath)) {
  const st = fs.lstatSync(linkPath);
  if (st.isSymbolicLink() || st.isDirectory()) {
    fs.rmSync(linkPath, { recursive: true, force: true });
  }
}

fs.symlinkSync(absUpload, linkPath, "dir");
console.log(`[link-uploads] ${linkPath} → ${absUpload}`);
