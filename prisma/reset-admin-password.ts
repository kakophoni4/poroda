/**
 * Сброс пароля админа admin@porodacosmetics.ru.
 * Запуск из папки poroda-site (с DATABASE_URL в .env):
 *   npx tsx prisma/reset-admin-password.ts
 * Пароль по умолчанию: admin123. Либо задай ADMIN_PASSWORD=новый_пароль
 */
import path from "node:path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

config({ path: path.resolve(process.cwd(), ".env") });
const raw = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/poroda";
const poolConfig =
  raw.includes("supabase") || raw.includes("pooler.")
    ? { connectionString: raw, ssl: { rejectUnauthorized: false } as const }
    : { connectionString: raw };
const adapter = new PrismaPg(poolConfig);
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = "admin@porodacosmetics.ru";
const newPassword = process.env.ADMIN_PASSWORD || "admin123";

async function main() {
  const hash = await bcrypt.hash(newPassword, 10);
  const admin = await prisma.admin.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash: hash },
    create: {
      email: ADMIN_EMAIL,
      passwordHash: hash,
      name: "Администратор",
    },
  });
  console.log("Пароль для", admin.email, "установлен. Вход: пароль =", newPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
