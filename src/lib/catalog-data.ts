export type Product = {
  id: string;
  slug: string;
  title: string;
  shortDesc?: string;
  category: string;
  categorySlug: string;
  price: number;
  oldPrice?: number;
  isNew?: boolean;
  skinTypes?: string[];
};

export type CatalogCategory = {
  slug: string;
  title: string;
  productCount: number;
};

export const categories: CatalogCategory[] = [
  { slug: "cleansing", title: "Очищение", productCount: 4 },
  { slug: "toners", title: "Тонизация", productCount: 2 },
  { slug: "serums", title: "Сыворотки", productCount: 5 },
  { slug: "creams", title: "Кремы", productCount: 3 },
  { slug: "masks", title: "Маски", productCount: 2 },
  { slug: "sets", title: "Наборы", productCount: 3 },
];

export const products: Product[] = [
  {
    id: "1",
    slug: "enzimnaya-pudra-umyvanie",
    title: "Энзимная пудра для умывания с цинком PCA",
    shortDesc: "Мягкое ферментное очищение, себорегуляция.",
    category: "Очищение",
    categorySlug: "cleansing",
    price: 1287,
    isNew: true,
    skinTypes: ["комбинированная", "жирная", "чувствительная"],
  },
  {
    id: "2",
    slug: "gel-umyvanie",
    title: "Гель для умывания с пребиотиками",
    shortDesc: "Бережное очищение без пересушивания.",
    category: "Очищение",
    categorySlug: "cleansing",
    price: 890,
    skinTypes: ["все типы"],
  },
  {
    id: "3",
    slug: "tonik-aktivator",
    title: "Тоник-активатор для подготовки кожи",
    shortDesc: "Подготавливает кожу к сывороткам и кремам.",
    category: "Тонизация",
    categorySlug: "toners",
    price: 950,
    skinTypes: ["все типы"],
  },
  {
    id: "4",
    slug: "syvorotka-niacinamide",
    title: "Сыворотка с ниацинамидом 10%",
    shortDesc: "Против воспалений и неровного тона.",
    category: "Сыворотки",
    categorySlug: "serums",
    price: 1450,
    isNew: true,
    skinTypes: ["комбинированная", "жирная", "проблемная"],
  },
  {
    id: "5",
    slug: "syvorotka-vitamin-c",
    title: "Сыворотка с витамином C",
    shortDesc: "Осветление пигментации и сияние.",
    category: "Сыворотки",
    categorySlug: "serums",
    price: 1690,
    skinTypes: ["все типы"],
  },
  {
    id: "6",
    slug: "krem-uvlazhnyayushchiy",
    title: "Увлажняющий крем с гиалуроновой кислотой",
    shortDesc: "Восстановление барьера и комфорт.",
    category: "Кремы",
    categorySlug: "creams",
    price: 1290,
    skinTypes: ["сухая", "обезвоженная", "чувствительная"],
  },
  {
    id: "7",
    slug: "nabor-5-sredstv",
    title: "Полный набор 5 средств для комплексного ухода",
    shortDesc: "Очищение, увлажнение, активы под задачу.",
    category: "Наборы",
    categorySlug: "sets",
    price: 6900,
    oldPrice: 8200,
    skinTypes: ["все типы"],
  },
  {
    id: "8",
    slug: "mask-gidratiruyushchaya",
    title: "Гидрофиксирующая маска",
    shortDesc: "Интенсивное увлажнение и сияние.",
    category: "Маски",
    categorySlug: "masks",
    price: 890,
    skinTypes: ["все типы"],
  },
];

export type SortOption = "popular" | "sale" | "new" | "price_asc" | "price_desc";

export const sortOptions: { value: SortOption; label: string }[] = [
  { value: "popular", label: "популярные" },
  { value: "sale", label: "акционные" },
  { value: "new", label: "по новизне" },
  { value: "price_asc", label: "от дешевых к дорогим" },
  { value: "price_desc", label: "от дорогих к дешевым" },
];

export function sortProducts(products: Product[], sort: SortOption): Product[] {
  const arr = [...products];
  switch (sort) {
    case "price_asc":
      return arr.sort((a, b) => a.price - b.price);
    case "price_desc":
      return arr.sort((a, b) => b.price - a.price);
    case "new":
      return arr.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    case "sale":
      return arr.sort((a, b) => (b.oldPrice ? 1 : 0) - (a.oldPrice ? 1 : 0));
    case "popular":
    default:
      return arr;
  }
}
