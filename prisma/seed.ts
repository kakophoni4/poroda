import path from "node:path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

config({ path: path.resolve(process.cwd(), ".env") });
const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/poroda";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || "admin123";
  const hash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.admin.upsert({
    where: { email: "admin@porodacosmetics.ru" },
    update: {},
    create: {
      email: "admin@porodacosmetics.ru",
      passwordHash: hash,
      name: "Администратор",
    },
  });
  console.log("Admin:", admin.email);

  const catCleansing = await prisma.category.upsert({
    where: { slug: "cleansing" },
    update: {},
    create: { slug: "cleansing", title: "Очищение", sortOrder: 1 },
  });
  const catSerums = await prisma.category.upsert({
    where: { slug: "serums" },
    update: {},
    create: { slug: "serums", title: "Сыворотки", sortOrder: 2 },
  });
  const catCreams = await prisma.category.upsert({
    where: { slug: "creams" },
    update: {},
    create: { slug: "creams", title: "Кремы", sortOrder: 3 },
  });
  const catSets = await prisma.category.upsert({
    where: { slug: "sets" },
    update: {},
    create: { slug: "sets", title: "Наборы", sortOrder: 4 },
  });

  await prisma.product.upsert({
    where: { slug: "enzimnaya-pudra-umyvanie" },
    update: {},
    create: {
      slug: "enzimnaya-pudra-umyvanie",
      title: "Энзимная пудра для умывания с цинком PCA",
      shortDesc: "Мягкое ферментное очищение, себорегуляция.",
      categoryId: catCleansing.id,
      price: 1287,
      isNew: true,
      skinTypes: ["комбинированная", "жирная", "чувствительная"],
      sortOrder: 1,
    },
  });
  await prisma.product.upsert({
    where: { slug: "nabor-5-sredstv" },
    update: {},
    create: {
      slug: "nabor-5-sredstv",
      title: "Полный набор 5 средств для комплексного ухода",
      shortDesc: "Очищение, увлажнение, активы под задачу.",
      categoryId: catSets.id,
      price: 6900,
      oldPrice: 8200,
      skinTypes: ["все типы"],
      sortOrder: 2,
    },
  });

  await prisma.promo.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      percent: 10,
      description: "Приветственная скидка 10%",
      maxUses: 1000,
      active: true,
    },
  });
  console.log("Seed done.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
