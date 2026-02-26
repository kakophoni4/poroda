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
        <div key={i} className="h-64 rounded-3xl border border-zinc-200 bg-zinc-50 animate-pulse" />
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
      products = dbProducts.map((p) => ({
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
      }));
      categories = dbCategories.map((c) => ({ id: c.id, slug: c.slug, title: c.title, productCount: c._count.products }));
    }
  } catch {
    // БД не настроена — используем статичные данные
  }
  return (
    <PageShell>
      <Container>
        <Breadcrumbs items={[{ href: "/catalog", label: "Каталог" }]} />
        <h1 className="mt-4 text-3xl font-semibold">Каталог</h1>
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
