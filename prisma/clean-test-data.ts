/**
 * Удаляет ТЕСТОВЫЕ данные из БД, оставляя каталог и базовый контент:
 *   удаляет: Order, OrderItem, CustomerReview, PromoUse, WheelSpinLog,
 *            WheelGlobalCounter, UserNotification, PageView, User,
 *            а также все Promo, кроме сидового WELCOME10;
 *   обнуляет: Promo.usedCount = 0 для оставшихся.
 *
 * НЕ ТРОГАЕТ: Admin, Category, Product, SiteCopy, HomePromoBanner,
 *            HomeConcernCard, QuizQuestion, QuizAnswer, HomeArticle.
 *
 * Запуск: npx tsx prisma/clean-test-data.ts
 *
 * !!! Перед запуском в prod ОБЯЗАТЕЛЬНО снять дамп БД (pg_dump). !!!
 */
import path from "node:path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: path.resolve(process.cwd(), ".env") });

const raw = process.env.DATABASE_URL ?? "postgresql://poroda:poroda@127.0.0.1:5433/poroda?schema=public";
const urlSaysSsl = /[?&]sslmode=(require|no-verify|verify-full|prefer)(?:&|$)/i.test(raw);
const usePooledTls = raw.includes("pooler.") || urlSaysSsl;
const connectionString = usePooledTls
  ? `${raw}${raw.includes("?") ? "&" : "?"}connect_timeout=60`
  : raw;
const adapter = new PrismaPg(
  usePooledTls
    ? { connectionString, ssl: { rejectUnauthorized: false } as const, connectionTimeoutMillis: 60000 }
    : { connectionString }
);
const prisma = new PrismaClient({ adapter });

async function main() {
  if (!process.argv.includes("--yes")) {
    console.error(
      "Команда удалит ВСЕ заказы, отзывы, пользователей, wheel-логи и не-сидовые промокоды.\n" +
        "Для подтверждения добавьте флаг --yes:\n" +
        "  npx tsx prisma/clean-test-data.ts --yes"
    );
    process.exit(1);
  }

  console.log("Чищу тестовые данные…");

  // Сброс rate-limit журнала (нет FK, сначала).
  const authAttempts = await prisma.authAttempt.deleteMany({});

  // Порядок важен из-за FK.
  const reviewUploads = await prisma.customerReview.deleteMany({});
  const promoUses = await prisma.promoUse.deleteMany({});
  const orderItems = await prisma.orderItem.deleteMany({});
  const orders = await prisma.order.deleteMany({});
  const wheelLogs = await prisma.wheelSpinLog.deleteMany({});
  await prisma.wheelGlobalCounter.deleteMany({});
  const notifs = await prisma.userNotification.deleteMany({});
  const views = await prisma.pageView.deleteMany({});
  const users = await prisma.user.deleteMany({});

  // Удаляем все промокоды, кроме сидового WELCOME10 (его сохраняем — добавится через seed заново).
  const promos = await prisma.promo.deleteMany({
    where: { code: { not: "WELCOME10" } },
  });
  await prisma.promo.updateMany({
    where: { code: "WELCOME10" },
    data: { usedCount: 0 },
  });

  // Mailing — это рассылки админа. Если есть тестовые — удаляем.
  let mailings = { count: 0 };
  try {
    mailings = await prisma.mailing.deleteMany({});
  } catch {
    // таблицы может не быть, если она опциональна — игнорируем
  }

  console.log("Удалено:");
  console.log(`  AuthAttempt:         ${authAttempts.count}`);
  console.log(`  Order:               ${orders.count}`);
  console.log(`  OrderItem:           ${orderItems.count}`);
  console.log(`  CustomerReview:      ${reviewUploads.count}`);
  console.log(`  PromoUse:            ${promoUses.count}`);
  console.log(`  Promo (не WELCOME):  ${promos.count}`);
  console.log(`  WheelSpinLog:        ${wheelLogs.count}`);
  console.log(`  UserNotification:    ${notifs.count}`);
  console.log(`  PageView:            ${views.count}`);
  console.log(`  User:                ${users.count}`);
  console.log(`  Mailing:             ${mailings.count}`);
  console.log("Готово. Каталог, админ и сидовый контент сохранены.");
  console.log("ВАЖНО: вручную удалите файлы из public/uploads/reviews — они уже не нужны.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().then(() => process.exit(1));
  });
