import { notFound } from "next/navigation";
import Container from "@/components/Container";
import PageShell from "@/components/PageShell";
import Breadcrumbs from "@/components/Breadcrumbs";
import { products as staticProducts } from "@/lib/catalog-data";
import ProductPageClient from "./ProductPageClient";
import { prisma } from "@/lib/db";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let product: { id: string; slug: string; title: string; shortDesc?: string; category: string; categorySlug: string; price: number; oldPrice?: number; isNew?: boolean; skinTypes?: string[] } | null = null;
  try {
    const p = await prisma.product.findUnique({ where: { slug }, include: { category: true } });
    if (p) product = { id: p.id, slug: p.slug, title: p.title, shortDesc: p.shortDesc ?? undefined, category: p.category.title, categorySlug: p.category.slug, price: p.price, oldPrice: p.oldPrice ?? undefined, isNew: p.isNew, skinTypes: p.skinTypes };
  } catch {
    // БД не настроена
  }
  if (!product) product = staticProducts.find((p) => p.slug === slug) ?? null;
  if (!product) notFound();

  return (
    <PageShell>
      <Container>
        <Breadcrumbs
          items={[
            { href: "/catalog", label: "Каталог" },
            { href: `/catalog?category=${product.categorySlug}`, label: product.category },
            { label: product.title },
          ]}
        />
        <ProductPageClient product={product} />
      </Container>
    </PageShell>
  );
}
