import { prisma } from "@/lib/db";
import { products as staticProducts } from "@/lib/catalog-data";

const FEATURED_COUNT = 6;
const categoryToFolder: Record<string, number> = {
  cleansing: 1,
  toners: 2,
  serums: 3,
  creams: 4,
  masks: 5,
  sets: 6,
};

/** Число и «₽» не разъезжаются на две строки */
export function formatFeaturedRub(price: number): string {
  return `${price.toLocaleString("ru-RU")}\u00a0₽`;
}

export type FeaturedProduct = {
  id: string;
  slug: string;
  title: string;
  shortDesc?: string;
  price: number;
  priceFormatted: string;
  imageUrl: string;
};

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export async function getFeaturedProducts(): Promise<FeaturedProduct[]> {
  try {
    const featured = await prisma.product.findMany({
      where: { featuredSortOrder: { not: null } },
      orderBy: { featuredSortOrder: "asc" },
      include: { category: { select: { slug: true } } },
      take: FEATURED_COUNT,
    });
    if (featured.length > 0) {
      const defaultImg = (slug: string) => `/images/poroda/${categoryToFolder[slug] ?? 1}/1.jpg`;
      return featured.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        shortDesc: p.shortDesc ?? undefined,
        price: p.price,
        priceFormatted: formatFeaturedRub(p.price),
        imageUrl: p.imageUrl ?? defaultImg(p.category.slug),
      }));
    }
    const all = await prisma.product.findMany({
      include: { category: { select: { slug: true } } },
    });
    if (all.length === 0) throw new Error("no products");
    const shuffled = shuffle(all).slice(0, FEATURED_COUNT);
    const defaultImg = (slug: string) => `/images/poroda/${categoryToFolder[slug] ?? 1}/1.jpg`;
    return shuffled.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      shortDesc: p.shortDesc ?? undefined,
      price: p.price,
      priceFormatted: formatFeaturedRub(p.price),
      imageUrl: p.imageUrl ?? defaultImg(p.category.slug),
    }));
  } catch {
    const list = shuffle(staticProducts).slice(0, FEATURED_COUNT);
    return list.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      shortDesc: p.shortDesc,
      price: p.price,
      priceFormatted: formatFeaturedRub(p.price),
      imageUrl: p.imageUrl ?? `/images/poroda/${categoryToFolder[p.categorySlug] ?? 1}/1.jpg`,
    }));
  }
}

function mapDbProduct(
  p: { id: string; slug: string; title: string; shortDesc: string | null; price: number; imageUrl: string | null; category: { slug: string } }
): FeaturedProduct {
  const defaultImg = (slug: string) => `/images/poroda/${categoryToFolder[slug] ?? 1}/1.jpg`;
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    shortDesc: p.shortDesc ?? undefined,
    price: p.price,
    priceFormatted: formatFeaturedRub(p.price),
    imageUrl: p.imageUrl ?? defaultImg(p.category.slug),
  };
}

/** Вся продукция для блока «Наша продукция» на главной (карусель) */
export async function getAllProductsForHome(): Promise<FeaturedProduct[]> {
  try {
    const all = await prisma.product.findMany({
      include: { category: { select: { slug: true, sortOrder: true } } },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { title: "asc" }],
    });
    if (all.length > 0) return all.map(mapDbProduct);
    throw new Error("no products");
  } catch {
    return staticProducts.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      shortDesc: p.shortDesc,
      price: p.price,
      priceFormatted: formatFeaturedRub(p.price),
      imageUrl: p.imageUrl ?? `/images/poroda/${categoryToFolder[p.categorySlug] ?? 1}/1.jpg`,
    }));
  }
}
