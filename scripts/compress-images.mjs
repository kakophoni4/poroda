/**
 * Сжатие всех фото в public/images без видимой потери качества.
 * - Ресайз: макс. 1920px по длинной стороне (для веба достаточно).
 * - JPEG quality 90 (визуально как 100), PNG — максимальное сжатие.
 * Перезаписывает файлы на месте, имена и расширения не меняются.
 *
 * Запуск: node scripts/compress-images.mjs
 * Без ресайза (только пережатие): node scripts/compress-images.mjs --no-resize
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, "..", "public", "images");
const MAX_SIDE = 1920;
const JPEG_QUALITY = 90;
const EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const noResize = process.argv.includes("--no-resize");

function getAllImagePaths(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) getAllImagePaths(full, acc);
    else if (EXTENSIONS.has(path.extname(e.name).toLowerCase())) acc.push(full);
  }
  return acc;
}

async function compressOne(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const tempPath = filePath + ".tmp." + ext.replace(".", "");
  let pipeline = sharp(filePath);
  const meta = await pipeline.metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;

  if (!noResize && (w > MAX_SIDE || h > MAX_SIDE)) {
    const scale = MAX_SIDE / Math.max(w, h);
    pipeline = pipeline.resize(Math.round(w * scale), Math.round(h * scale));
  }

  if (ext === ".png") {
    await pipeline.png({ compressionLevel: 9 }).toFile(tempPath);
  } else if (ext === ".webp") {
    await pipeline.webp({ quality: 88 }).toFile(tempPath);
  } else {
    await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(tempPath);
  }

  fs.renameSync(tempPath, filePath);
}

async function main() {
  const files = getAllImagePaths(IMAGES_DIR);
  if (files.length === 0) {
    console.log("В public/images нет изображений.");
    return;
  }
  console.log(`Найдено: ${files.length}. Ресайз: ${noResize ? "нет" : `макс ${MAX_SIDE}px`}, JPEG q=${JPEG_QUALITY}`);
  let done = 0;
  let errCount = 0;
  for (const f of files) {
    try {
      await compressOne(f);
      done++;
      if (done % 50 === 0) console.log(`${done}/${files.length}`);
    } catch (e) {
      errCount++;
      console.error(`Ошибка ${f}:`, e.message);
    }
  }
  console.log(`Готово: ${done} ok, ${errCount} ошибок.`);
}

main();
