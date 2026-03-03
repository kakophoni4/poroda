/**
 * Копирует фото из папки "фото PORODA" (подпапки 1, 2, 3, … и общие) в public/images/poroda/
 * Запуск из корня poroda-site: node scripts/copy-poroda-photos.js
 */
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const publicImages = path.join(projectRoot, "public", "images", "poroda");

// Найти папку, в имени которой есть PORODA
const dirs = fs.readdirSync(projectRoot, { withFileTypes: true });
const photoDir = dirs.find((d) => d.isDirectory() && d.name.toUpperCase().includes("PORODA"));
if (!photoDir) {
  console.log("Папка с фото (имя содержит PORODA) не найдена в", projectRoot);
  process.exit(1);
}

const sourceRoot = path.join(projectRoot, photoDir.name);
if (!fs.existsSync(sourceRoot)) {
  console.log("Папка не найдена:", sourceRoot);
  process.exit(1);
}

if (!fs.existsSync(publicImages)) {
  fs.mkdirSync(publicImages, { recursive: true });
}

const subdirs = fs.readdirSync(sourceRoot, { withFileTypes: true }).filter((d) => d.isDirectory());
for (const sub of subdirs) {
  const match = sub.name.match(/^(\d+)/);
  const targetName = match ? match[1] : sub.name.replace(/\s+/g, "-").replace(/[^\w\-]/g, "") || sub.name;
  const targetDir = path.join(publicImages, targetName);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const files = fs.readdirSync(path.join(sourceRoot, sub.name)).filter((f) => {
    const p = path.join(sourceRoot, sub.name, f);
    return fs.statSync(p).isFile() && /\.(jpg|jpeg|png|webp|gif)$/i.test(f);
  });
  for (const file of files) {
    const src = path.join(sourceRoot, sub.name, file);
    const dest = path.join(targetDir, file);
    fs.copyFileSync(src, dest);
    console.log("Скопировано:", path.join(sub.name, file));
  }
  // Первое фото дублируем как 1.jpg для предсказуемого URL в каталоге (сид и карточки)
  if (files.length > 0) {
    const firstSrc = path.join(sourceRoot, sub.name, files[0]);
    const firstDest = path.join(targetDir, "1.jpg");
    fs.copyFileSync(firstSrc, firstDest);
  }
}
console.log("Готово. Фото в public/images/poroda/");
console.log("Общие файлы (если есть подпапка «общие») скопированы в public/images/poroda/");
// Копируем подпапку "общие" (имя не 1-7) для общих картинок сайта
const obshchieDir = subdirs.find((d) => /^\D/.test(d.name) && !/^[\d\s\-]+$/.test(d.name));
if (obshchieDir) {
  const obshchieDest = path.join(projectRoot, "public", "images", "obshchie");
  if (!fs.existsSync(obshchieDest)) fs.mkdirSync(obshchieDest, { recursive: true });
  const files = fs.readdirSync(path.join(sourceRoot, obshchieDir.name)).filter((f) => {
    const p = path.join(sourceRoot, obshchieDir.name, f);
    return fs.statSync(p).isFile() && /\.(jpg|jpeg|png|webp|gif)$/i.test(f);
  });
  for (const file of files) {
    const src = path.join(sourceRoot, obshchieDir.name, file);
    fs.copyFileSync(src, path.join(obshchieDest, file));
    console.log("Общие:", file);
  }
  // Первые файлы — для главной и каталога (hero.jpg, catalog-banner.jpg, about.jpg)
  if (files.length > 0) fs.copyFileSync(path.join(sourceRoot, obshchieDir.name, files[0]), path.join(obshchieDest, "hero.jpg"));
  if (files.length > 1) fs.copyFileSync(path.join(sourceRoot, obshchieDir.name, files[1]), path.join(obshchieDest, "catalog-banner.jpg"));
  if (files.length > 2) fs.copyFileSync(path.join(sourceRoot, obshchieDir.name, files[2]), path.join(obshchieDest, "about.jpg"));
}
