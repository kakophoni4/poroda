/**
 * Назначает всем позициям продукции в БД фото из папок public/images/poroda/1..7
 * по правилу: slug -> папка (из seed) или категория -> папка.
 * Запуск: npx tsx scripts/assign-product-photos.ts (из папки poroda-site)
 */
import path from "node:path";
import fs from "node:fs";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: path.resolve(process.cwd(), ".env") });
const raw = process.env.DATABASE_URL ?? "postgresql://postgres:qwe@localhost:5432/poroda";
const poolConfig =
  raw.includes("supabase") || raw.includes("pooler.")
    ? { connectionString: raw, ssl: { rejectUnauthorized: false } as const }
    : { connectionString: raw };
const adapter = new PrismaPg(poolConfig);
const prisma = new PrismaClient({ adapter });

const slugToFolder: Record<string, number> = {
  "gel-umyvanie": 1,
  "tonik-aktivator": 2,
  "syvorotka-niacinamide": 3,
  "krem-vokrug-glaz": 4,
  "krem-oranzhevyy": 5,
  "pudra-enzimnaya": 6,
  flyuid: 7,
};

const categorySlugToFolder: Record<string, number> = {
  cleansing: 1,
  toners: 2,
  serums: 3,
  creams: 4,
  masks: 5,
  sets: 6,
};

const IMG_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function getFolderNum(slug: string, categorySlug: string): number {
  return slugToFolder[slug] ?? categorySlugToFolder[categorySlug] ?? 1;
}

function listImagesInFolder(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  const names = files
    .filter((f) => f.isFile() && IMG_EXT.has(path.extname(f.name).toLowerCase()))
    .map((f) => f.name);
  names.sort((a, b) => {
    if (a.toLowerCase() === "1.jpg") return -1;
    if (b.toLowerCase() === "1.jpg") return 1;
    return a.localeCompare(b);
  });
  return names;
}

async function main() {
  const baseDir = path.join(process.cwd(), "public", "images", "poroda");
  const products = await prisma.product.findMany({ include: { category: true } });

  for (const p of products) {
    const folderNum = getFolderNum(p.slug, p.category.slug);
    const dir = path.join(baseDir, String(folderNum));
    const fileNames = listImagesInFolder(dir);
    const imageUrls = fileNames.map((name) => `/images/poroda/${folderNum}/${encodeURIComponent(name)}`);
    if (imageUrls.length === 0) {
      const fallback = `/images/poroda/${folderNum}/1.jpg`;
      await prisma.product.update({
        where: { id: p.id },
        data: { imageUrl: fallback, imageUrls: [fallback] },
      });
      console.log(p.slug, "— нет файлов в папке", folderNum, ", задано fallback");
    } else {
      await prisma.product.update({
        where: { id: p.id },
        data: { imageUrl: imageUrls[0], imageUrls },
      });
      console.log(p.slug, "— папка", folderNum, ", фото:", imageUrls.length);
    }
  }
  console.log("Готово. Обновлено позиций:", products.length);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
