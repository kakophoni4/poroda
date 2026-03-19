import type { HomeConcernCardPublic } from "@/lib/home-concern-cards-public";
import type { HomeArticlePublic } from "@/lib/home-articles";

/** Показываем на главной, если в БД нет активных карточек (как после seed). */
export const FALLBACK_HOME_CONCERN_CARDS: HomeConcernCardPublic[] = [
  { id: "fb-concern-0", title: "Акне и воспаления", imageUrl: "/images/obshchie/hero.jpg", catalogQuery: "" },
  { id: "fb-concern-1", title: "Пигментация и пост-акне", imageUrl: "/images/obshchie/hero.jpg", catalogQuery: "" },
  { id: "fb-concern-2", title: "Возрастные изменения", imageUrl: "/images/obshchie/hero.jpg", catalogQuery: "" },
  { id: "fb-concern-3", title: "Чувствительность и реактивность", imageUrl: "/images/obshchie/hero.jpg", catalogQuery: "" },
  { id: "fb-concern-4", title: "Тусклый тон и рельеф", imageUrl: "/images/obshchie/hero.jpg", catalogQuery: "" },
  { id: "fb-concern-5", title: "Обезвоженность и сухость", imageUrl: "/images/obshchie/hero.jpg", catalogQuery: "" },
];

export const FALLBACK_HOME_ARTICLES: HomeArticlePublic[] = [
  {
    id: "fb-article-0",
    title: "Ниацинамид в косметике: что доказывают исследования",
    linkUrl: "/blog",
    description: "Обзор клинических данных по концентрациям 2–10% и влиянию на барьер кожи и пигментацию.",
  },
  {
    id: "fb-article-1",
    title: "SPF ежедневно: почему это не «летняя» опция",
    linkUrl: "/catalog",
    description: "Фотостарение и UVA — что меняется при регулярной защите и как выбрать текстуру.",
  },
  {
    id: "fb-article-2",
    title: "Микробиом кожи и «добрые» бактерии в формулах",
    linkUrl: "/about",
    description: "Как пробиотики в уходе поддерживают баланс кожи.",
  },
];
