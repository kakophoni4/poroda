import { notFound } from "next/navigation";
import Container from "@/components/Container";
import PageShell from "@/components/PageShell";
import { products as staticProducts, type Product } from "@/lib/catalog-data";
import { parseHowItWorksLines, parseResearchLinks } from "@/lib/product-detail";
import ProductPageClient from "./ProductPageClient";
import { prisma } from "@/lib/db";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let product: Product | null = null;
  const categoryToFolder: Record<string, number> = { cleansing: 1, toners: 2, serums: 3, creams: 4, masks: 5, sets: 6 };
  try {
    const p = await prisma.product.findUnique({ where: { slug }, include: { category: true } });
    if (p) {
      const fallback = `/images/poroda/${categoryToFolder[p.category.slug] ?? 1}/1.jpg`;
      const imageUrls = (p as { imageUrls?: string[] }).imageUrls?.length
        ? (p as { imageUrls?: string[] }).imageUrls!
        : (p.imageUrl ? [p.imageUrl] : [fallback]);
      const pd = p as typeof p & {
        articleCode?: string | null;
        problemText?: string | null;
        careStageText?: string | null;
        skinTypesLine?: string | null;
        scientistsTitle?: string | null;
        researchLinks?: unknown;
        forWhatText?: string | null;
        howItWorksLines?: unknown;
        howToUseText?: string | null;
        inciText?: string | null;
        volumeText?: string | null;
        shelfLifeText?: string | null;
        countryText?: string | null;
        inStock?: boolean;
      };
      product = {
        id: p.id, slug: p.slug, title: p.title, shortDesc: p.shortDesc ?? undefined,
        category: p.category.title, categorySlug: p.category.slug, price: p.price,
        oldPrice: p.oldPrice ?? undefined, isNew: p.isNew, skinTypes: p.skinTypes,
        imageUrl: p.imageUrl ?? fallback, imageUrls,
        imageFocusX: p.imageFocusX ?? undefined,
        imageFocusY: p.imageFocusY ?? undefined,
        composition: p.composition ?? undefined, components: p.components ?? undefined,
        extraField1: p.extraField1 ?? undefined, extraField2: p.extraField2 ?? undefined,
        articleCode: pd.articleCode ?? undefined,
        problemText: pd.problemText ?? undefined,
        careStageText: pd.careStageText ?? undefined,
        skinTypesLine: pd.skinTypesLine ?? undefined,
        scientistsTitle: pd.scientistsTitle ?? undefined,
        researchLinks: parseResearchLinks(pd.researchLinks),
        forWhatText: pd.forWhatText ?? undefined,
        howItWorksLines: parseHowItWorksLines(pd.howItWorksLines),
        howToUseText: pd.howToUseText ?? undefined,
        inciText: pd.inciText ?? undefined,
        volumeText: pd.volumeText ?? undefined,
        shelfLifeText: pd.shelfLifeText ?? undefined,
        countryText: pd.countryText ?? undefined,
        inStock: pd.inStock !== false,
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
        <ProductPageClient product={product} />
      </Container>
    </PageShell>
  );
}
