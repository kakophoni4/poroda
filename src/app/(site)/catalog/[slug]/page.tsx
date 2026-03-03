import { notFound } from "next/navigation";
import Container from "@/components/Container";
import PageShell from "@/components/PageShell";
import Breadcrumbs from "@/components/Breadcrumbs";
import { products as staticProducts } from "@/lib/catalog-data";
import ProductPageClient from "./ProductPageClient";
import { prisma } from "@/lib/db";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  type ProductShape = { id: string; slug: string; title: string; shortDesc?: string; category: string; categorySlug: string; price: number; oldPrice?: number; isNew?: boolean; skinTypes?: string[]; imageUrl?: string; imageUrls?: string[]; imageFocusX?: number | null; imageFocusY?: number | null; composition?: string; components?: string; extraField1?: string; extraField2?: string };
  let product: ProductShape | null = null;
  const categoryToFolder: Record<string, number> = { cleansing: 1, toners: 2, serums: 3, creams: 4, masks: 5, sets: 6 };
  try {
    const p = await prisma.product.findUnique({ where: { slug }, include: { category: true } });
    if (p) {
      const fallback = `/images/poroda/${categoryToFolder[p.category.slug] ?? 1}/1.jpg`;
      const imageUrls = (p as { imageUrls?: string[] }).imageUrls?.length
        ? (p as { imageUrls?: string[] }).imageUrls!
        : (p.imageUrl ? [p.imageUrl] : [fallback]);
      product = {
        id: p.id, slug: p.slug, title: p.title, shortDesc: p.shortDesc ?? undefined,
        category: p.category.title, categorySlug: p.category.slug, price: p.price,
        oldPrice: p.oldPrice ?? undefined, isNew: p.isNew, skinTypes: p.skinTypes,
        imageUrl: p.imageUrl ?? fallback, imageUrls,
        imageFocusX: (p as { imageFocusX?: number | null }).imageFocusX ?? undefined,
        imageFocusY: (p as { imageFocusY?: number | null }).imageFocusY ?? undefined,
        composition: p.composition ?? undefined, components: p.components ?? undefined,
        extraField1: p.extraField1 ?? undefined, extraField2: p.extraField2 ?? undefined,
      };
    }
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
