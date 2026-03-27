import { Suspense } from "react";
import Container from "@/components/Container";
import PageShell from "@/components/PageShell";
import CheckoutClient from "./CheckoutClient";
import { products as staticProducts } from "@/lib/catalog-data";
import { prisma } from "@/lib/db";
import { getSiteCopyMap } from "@/lib/site-copy-server";

export default async function CheckoutPage() {
  const copy = await getSiteCopyMap();
  let products = staticProducts;
  try {
    const dbProducts = await prisma.product.findMany({ include: { category: { select: { slug: true, title: true } } } });
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
    }
  } catch {
    // БД не настроена
  }
  return (
    <PageShell>
      <Container>
        <h1 className="mt-4 text-3xl font-semibold">{copy["checkout.title"]}</h1>
        <Suspense fallback={<div className="liquidGlass-dock mt-8 h-64 animate-pulse rounded-3xl border border-white/40" />}>
          <CheckoutClient products={products} />
        </Suspense>
      </Container>
    </PageShell>
  );
}
