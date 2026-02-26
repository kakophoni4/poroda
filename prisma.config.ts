import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Грузим .env из папки проекта (где лежит prisma.config.ts), а не из текущей рабочей директории.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env"), override: true });

// На Vercel при сборке DATABASE_URL может быть не задан — используем заглушку для prisma generate.
const url =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@127.0.0.1:5432/poroda";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url,
  },
});
