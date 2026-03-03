import path from "node:path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

config({ path: path.resolve(process.cwd(), ".env") });
// Для Supabase: сид лучше запускать с прямым подключением (Session), иначе pooler:6543 может обрывать соединение.
const raw = process.env.SEED_DATABASE_URL ?? process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/poroda";
const isSupabase = raw.includes("supabase") || raw.includes("pooler.");
const connectionString = isSupabase ? `${raw}${raw.includes("?") ? "&" : "?"}connect_timeout=60` : raw;
const poolConfig = isSupabase
  ? { connectionString, ssl: { rejectUnauthorized: false } as const, connectionTimeoutMillis: 60000 }
  : { connectionString };
const adapter = new PrismaPg(poolConfig);
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
  const catToners = await prisma.category.upsert({
    where: { slug: "toners" },
    update: {},
    create: { slug: "toners", title: "Тонизация", sortOrder: 5 },
  });
  const catMasks = await prisma.category.upsert({
    where: { slug: "masks" },
    update: {},
    create: { slug: "masks", title: "Маски", sortOrder: 6 },
  });

  // Товары по папкам фото (1 ГЕЛЬ, 2 ТОНИК, 3 СЫВОРОТКА, 4 КРЕМ ВОКРУГ ГЛАЗ, 5 КРЕМ ОРАНЖЕВЫЙ, 6 Пудра, 7 ФЛЮИД) — названия/описания в стиле porodacosmetics.ru
  const testProducts = [
    { slug: "gel-umyvanie", title: "Гель для умывания", shortDesc: "Бережное очищение кожи. Подходит для ежедневного ухода.", categoryId: catCleansing.id, price: 890, imageUrl: "/images/poroda/1/1.jpg", sortOrder: 10 },
    { slug: "tonik-aktivator", title: "Тоник-активатор", shortDesc: "Подготавливает кожу к нанесению сывороток и кремов. Тонизирует и освежает.", categoryId: catToners.id, price: 950, imageUrl: "/images/poroda/2/1.jpg", sortOrder: 11 },
    { slug: "syvorotka-niacinamide", title: "Сыворотка с ниацинамидом", shortDesc: "Выравнивает тон кожи, уменьшает воспаления. Для комбинированной и жирной кожи.", categoryId: catSerums.id, price: 1450, isNew: true, imageUrl: "/images/poroda/3/1.jpg", sortOrder: 12 },
    { slug: "krem-vokrug-glaz", title: "Крем вокруг глаз", shortDesc: "Уход за нежной кожей вокруг глаз. Увлажнение и уменьшение отёчности.", categoryId: catCreams.id, price: 1290, imageUrl: "/images/poroda/4/1.jpg", sortOrder: 13 },
    { slug: "krem-oranzhevyy", title: "Крем оранжевый", shortDesc: "Питательный крем с витаминами. Сияние и упругость кожи.", categoryId: catCreams.id, price: 1590, imageUrl: "/images/poroda/5/1.jpg", sortOrder: 14 },
    { slug: "pudra-enzimnaya", title: "Пудра энзимная для умывания", shortDesc: "Мягкое ферментное очищение. Подходит для чувствительной кожи.", categoryId: catCleansing.id, price: 1287, imageUrl: "/images/poroda/6/1.jpg", sortOrder: 15 },
    { slug: "flyuid", title: "Флюид", shortDesc: "Лёгкая текстура, быстрое впитывание. Увлажнение без липкости.", categoryId: catCreams.id, price: 1190, imageUrl: "/images/poroda/7/1.jpg", sortOrder: 16 },
  ];

  for (const data of testProducts) {
    await prisma.product.upsert({
      where: { slug: data.slug },
      update: { imageUrl: data.imageUrl },
      create: { ...data, skinTypes: ["все типы"] },
    });
  }

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
