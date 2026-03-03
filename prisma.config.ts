import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Грузим .env из папки проекта (где лежит prisma.config.ts), а не из текущей рабочей директории.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env"), override: true });

// Локально: из .env. Для CLI (migrate/push) Prisma читает env до загрузки конфига — задаём явно.
const url =
  process.env.DATABASE_URL?.trim() ||
  "postgresql://postgres:qwe@localhost:5432/poroda";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url,
  },
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});
