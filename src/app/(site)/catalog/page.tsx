import { Suspense } from "react";
import Container from "@/components/Container";
import PageShell from "@/components/PageShell";
import Breadcrumbs from "@/components/Breadcrumbs";
import CatalogClient from "./CatalogClient";
import { products as staticProducts, categories as staticCategories } from "@/lib/catalog-data";
import { prisma } from "@/lib/db";

function CatalogFallback() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="liquidGlass-dock h-64 rounded-3xl animate-pulse border border-white/40" />
      ))}
    </div>
  );
}

export default async function CatalogPage() {
  let products = staticProducts;
  let categories = staticCategories.map((c) => ({ id: c.slug, slug: c.slug, title: c.title, productCount: c.productCount }));
  try {
    const [dbCategories, dbProducts] = await Promise.all([
      prisma.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } }),
      prisma.product.findMany({ include: { category: { select: { slug: true, title: true } } } }),
    ]);
    if (dbProducts.length > 0) {
      const categoryToFolder: Record<string, number> = { cleansing: 1, toners: 2, serums: 3, creams: 4, masks: 5, sets: 6 };
      const defaultImg = (slug: string) => `/images/poroda/${categoryToFolder[slug] ?? 1}/1.jpg`;
      products = dbProducts.map((p) => {
        const fallback = defaultImg(p.category.slug);
        const imageUrls = (p as { imageUrls?: string[] }).imageUrls?.length
          ? (p as { imageUrls?: string[] }).imageUrls!
          : (p.imageUrl ? [p.imageUrl] : [fallback]);
        return {
          id: p.id,
          slug: p.slug,
          title: p.title,
          shortDesc: p.shortDesc || undefined,
          category: p.category.title,
          categorySlug: p.category.slug,
          price: p.price,
          oldPrice: p.oldPrice ?? undefined,
          isNew: p.isNew,
          skinTypes: p.skinTypes,
          imageUrl: p.imageUrl ?? fallback,
          imageUrls,
          imageFocusX: (p as { imageFocusX?: number | null }).imageFocusX ?? undefined,
          imageFocusY: (p as { imageFocusY?: number | null }).imageFocusY ?? undefined,
          composition: p.composition ?? undefined,
          components: p.components ?? undefined,
          extraField1: p.extraField1 ?? undefined,
          extraField2: p.extraField2 ?? undefined,
        };
      });
      categories = dbCategories.map((c) => ({ id: c.id, slug: c.slug, title: c.title, productCount: c._count.products }));
    }
  } catch {
    // БД не настроена — используем статичные данные
  }
  return (
    <PageShell>
      <Container>
        <Breadcrumbs items={[{ href: "/catalog", label: "Каталог" }]} />
        <div className="liquidGlass-dock mt-4 aspect-[3/1] max-h-48 w-full overflow-hidden rounded-3xl border border-white/40">
          <img src="/images/obshchie/catalog-banner.jpg" alt="" className="h-full w-full object-cover" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold">Каталог</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-700">
          Профессиональная уходовая косметика PORODA. Выберите категорию или сортировку.
        </p>
        <Suspense fallback={<CatalogFallback />}>
          <CatalogClient initialProducts={products} categories={categories} />
        </Suspense>
      </Container>
    </PageShell>
  );
}
