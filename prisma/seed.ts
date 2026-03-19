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

  // Пример развёрнутой карточки продукции (как skinprobiotic) — сыворотка
  try {
    await prisma.product.updateMany({
      where: { slug: "syvorotka-niacinamide" },
      data: {
        title: "Сыворотка-бустер с транексамовой кислотой и арбутином SkinSOS",
        price: 3200,
        articleCode: "SP2081",
        problemText:
          "застойные пятна и следы постакне, неровный, тусклый тон, акне и воспаления, пигментация",
        careStageText: "увлажнение и питание",
        skinTypesLine: "комбинированная, жирная, проблемная, нормальная",
        scientistsTitle: "Что говорят ученые?",
        researchLinks: [
          {
            label:
              "Исследование об уменьшении появления гиперпигментации лица при использовании средств с транексамовой кислотой и ниацинамидом",
            url: "https://pubmed.ncbi.nlm.nih.gov/24033822/",
          },
          {
            label:
              "Исследование о снижении уровня меланина в пигментных пятнах при использовании альфа-арбутина",
            url: "https://www.mdpi.com/2076-3921/10/7/1129",
          },
          {
            label: "Исследование об эффективности лизатов при акне",
            url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5418745/",
          },
          {
            label: "Исследование об эффективности молочной кислоты для выравнивания рельефа и текстуры кожи",
            url: "https://www.mdpi.com/2079-9284/10/5/131",
          },
        ],
        forWhatText:
          "Сыворотка-бустер для интенсивного ухода как ластик стирает несовершенства с кожи. Её активная формула помогает избавиться от застойных пятен и следов постакне, устраняет неоднородный цвет, уменьшает выраженность прыщей и других воспалений.\n\nС каждой неделей применения кожа становится ровнее и мягче, а пигментные пятна и следы прошлых высыпаний заметно светлеют.",
        howItWorksLines: [
          "Транексамовая кислота – работает на осветление поствоспалительной пигментации, укрепляет кожный барьер.",
          "Альфа-арбутин – осветляет и выравнивает тон кожи, борется с гиперпигментацией.",
          "Молочная кислота (Lactic Acid) – деликатная AHA: отшелушивает, сужает поры, выравнивает рельеф.",
          "Салициловая кислота – BHA: сокращает воспаления и чёрные точки, снижает жирность кожи.",
          "Лизаты бифидо- и лактобактерий – пробиотики для микрофлоры кожи, регенерация и успокоение.",
          "Ниацинамид – контроль себума, осветление пятен и следов постакне.",
        ],
        howToUseText:
          "Встряхнуть флакон. Нанести 3-4 капли сыворотки на предварительно очищенную кожу лица утром и вечером. По желанию сверху нанести крем.",
        inciText:
          "Aqua, Niacinamide, Butylene Glycol, Tranexamic Acid, Lactic Acid, Serine, Alanine, Glycine, Glutamic Acid, Lysine HCL, Threonine, Proline, Zinc Lactate, PEG-40 Hydrogenated Castor Oil, Lactobacillus Ferment Lysate, Propionibacterium Ferment Lysate, Bifida Ferment Lysate, Betaine, Alpha-Arbutin, Salicylic Acid, Glycyrrhiza Glabra Fermented Filtrate, Phenoxyethanol, Ethylhexylglycerin, Hydroxyethylcellulose, Fragrance, CI 16255, CI 42090.",
        volumeText: "30 мл",
        shelfLifeText: "см. на упаковке",
        countryText: "Россия",
        inStock: true,
      },
    });
    console.log("Product: обновлена развёрнутая карточка syvorotka-niacinamide.");
  } catch (e) {
    console.warn("Не удалось обновить демо-карточку продукции:", e);
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

  // Баннер на главной (таблица создаётся через npx prisma db push)
  try {
    await prisma.homePromoBanner.upsert({
      where: { id: "seed-banner-main" },
      update: {},
      create: {
        id: "seed-banner-main",
        imageUrl: "/images/obshchie/hero.jpg",
        linkUrl: "/catalog",
        buttonText: "Вся продукция",
        buttonColor: "#18181b",
        sortOrder: 0,
        active: true,
      },
    });
    console.log("Banner: добавлен баннер на главную.");
  } catch {
    console.warn("Баннер не добавлен: таблица HomePromoBanner отсутствует. Сначала выполни: npx prisma db push");
  }

  // Карточки «Выберите вашу проблему»
  const concernTitles = [
    "Акне и воспаления",
    "Пигментация и пост-акне",
    "Возрастные изменения",
    "Чувствительность и реактивность",
    "Тусклый тон и рельеф",
    "Обезвоженность и сухость",
  ];
  try {
    for (let i = 0; i < concernTitles.length; i++) {
      await prisma.homeConcernCard.upsert({
        where: { id: `seed-concern-${i}` },
        update: { title: concernTitles[i] },
        create: {
          id: `seed-concern-${i}`,
          title: concernTitles[i],
          imageUrl: "/images/obshchie/hero.jpg",
          catalogQuery: "",
          sortOrder: i,
          active: true,
        },
      });
    }
    console.log("Concern cards: добавлено карточек проблем.");
  } catch {
    console.warn("Карточки проблем не добавлены: таблица HomeConcernCard отсутствует. Выполни: npx prisma db push");
  }

  // Квиз подбора (всплывает на главной после 3 мин)
  try {
    const q = await prisma.quizQuestion.upsert({
      where: { id: "seed-quiz-skin" },
      update: { title: "Выберите тип вашей кожи" },
      create: {
        id: "seed-quiz-skin",
        title: "Выберите тип вашей кожи",
        sortOrder: 0,
        active: true,
      },
    });
    const answers = [
      { label: "Сухая", linkUrl: "/catalog?skin=dry", sortOrder: 0 },
      { label: "Жирная", linkUrl: "/catalog?skin=oily", sortOrder: 1 },
      { label: "Комбинированная", linkUrl: "/catalog?skin=combined", sortOrder: 2 },
    ];
    for (let i = 0; i < answers.length; i++) {
      const a = answers[i];
      await prisma.quizAnswer.upsert({
        where: { id: `seed-quiz-answer-${i}` },
        update: { label: a.label, linkUrl: a.linkUrl, sortOrder: a.sortOrder },
        create: {
          id: `seed-quiz-answer-${i}`,
          questionId: q.id,
          label: a.label,
          linkUrl: a.linkUrl,
          sortOrder: a.sortOrder,
        },
      });
    }
    console.log("Quiz: добавлен вопрос и ответы по типу кожи.");
  } catch {
    console.warn("Квиз не добавлен: таблицы QuizQuestion/QuizAnswer отсутствуют. Выполни: npx prisma db push");
  }

  // Статьи (блок «Исследования косметологии» на главной) — тестовые данные
  const articleSeeds = [
    {
      title: "Ниацинамид в косметике: что доказывают исследования",
      linkUrl: "/blog",
      description: "Обзор клинических данных по концентрациям 2–10% и влиянию на барьер кожи и пигментацию.",
      sortOrder: 0,
    },
    {
      title: "Ретиноиды и беременность: позиция дерматологов",
      linkUrl: "/faq",
      description: "Кратко о том, какие формы избегать и почему важна консультация врача.",
      sortOrder: 1,
    },
    {
      title: "SPF ежедневно: почему это не «летняя» опция",
      linkUrl: "/catalog",
      description: "Фотостарение и UVA — что меняется при регулярной защите и как выбрать текстуру.",
      sortOrder: 2,
    },
    {
      title: "Кислоты в домашнем уходе: pH, частота, сочетания",
      linkUrl: "/blog",
      description: "AHA/BHA: кому подходят, как вводить в рутину и не пересушить кожу.",
      sortOrder: 3,
    },
    {
      title: "Микробиом кожи и «добрые» бактерии в формулах",
      linkUrl: "/about",
      description: "Тестовая ссылка на страницу бренда — для проверки переходов с главной.",
      sortOrder: 4,
    },
    {
      title: "Постакне и рубцы: когда ждать эффекта от процедур",
      linkUrl: "/catalog?category=serums",
      description: "Реалистичные сроки и роль домашнего ухода между визитами к специалисту.",
      sortOrder: 5,
    },
  ];
  try {
    for (let i = 0; i < articleSeeds.length; i++) {
      const a = articleSeeds[i];
      await prisma.homeArticle.upsert({
        where: { id: `seed-article-${i}` },
        update: { title: a.title, linkUrl: a.linkUrl, description: a.description, sortOrder: a.sortOrder },
        create: {
          id: `seed-article-${i}`,
          title: a.title,
          linkUrl: a.linkUrl,
          description: a.description,
          sortOrder: a.sortOrder,
          active: true,
        },
      });
    }
    console.log("HomeArticle: добавлены статьи для блока «Исследования косметологии».");
  } catch {
    console.warn("Статьи не добавлены: таблица HomeArticle отсутствует. Выполни: npx prisma db push");
  }

  console.log("Seed done.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
