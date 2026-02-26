import "dotenv/config";
import { defineConfig } from "prisma/config";

// На Vercel при сборке DATABASE_URL может быть не задан — используем заглушку для prisma generate.
// Реальное подключение в рантайме идёт через src/lib/db.ts и process.env.DATABASE_URL.
const url =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@127.0.0.1:5432/poroda";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url,
  },
});
