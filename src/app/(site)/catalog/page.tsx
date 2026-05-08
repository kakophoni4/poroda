import { Suspense } from "react";
import Container from "@/components/Container";
import PageShell from "@/components/PageShell";
import CatalogClient from "./CatalogClient";
import { products as staticProducts, categories as staticCategories } from "@/lib/catalog-data";
import { prisma } from "@/lib/db";
import type { Product, CatalogCategory } from "@/lib/catalog-data";

const NO_STATIC_FOR_DB: Product[] = [];

function CatalogFallback() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="liquidGlass-dock h-64 rounded-3xl animate-pulse border border-white/40" />
      ))}
    </div>
  );
}

export default async function CatalogPage() {
  let dataSource: "static" | "db" = "static";
  const staticProductList: Product[] = staticProducts;
  let categories: {
    id: string;
    slug: string;
    title: string;
    productCount: number;
  }[] = staticCategories.map((c: CatalogCategory) => ({
    id: c.slug,
    slug: c.slug,
    title: c.title,
    productCount: c.productCount,
  }));

  try {
    const [dbCategories, productCount] = await Promise.all([
      prisma.category.findMany({
        where: { archivedAt: null },
        orderBy: { sortOrder: "asc" },
        include: {
          _count: { select: { products: { where: { archivedAt: null } } } },
        },
      }),
      prisma.product.count({ where: { archivedAt: null } }),
    ]);
    if (productCount > 0) {
      dataSource = "db";
      categories = dbCategories.map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        productCount: c._count.products,
      }));
    }
  } catch {
    // БД не настроена — dataSource=static, категории и товары из кода
  }
  return (
    <PageShell>
      <Container>
        <Suspense fallback={<CatalogFallback />}>
          <CatalogClient
            dataSource={dataSource}
            staticProductList={dataSource === "static" ? staticProductList : NO_STATIC_FOR_DB}
            categories={categories}
          />
        </Suspense>
      </Container>
    </PageShell>
  );
}
