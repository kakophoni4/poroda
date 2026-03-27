import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MAX_PRODUCT_TITLE_LENGTH } from "@/lib/product-title";
import { parseMarketplaceUrl } from "@/lib/marketplace-links";
import { parseDermatologistVideoUrl } from "@/lib/dermatologist-video";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  if (body.title != null && String(body.title).trim().length > MAX_PRODUCT_TITLE_LENGTH) {
    return NextResponse.json(
      { error: `Название не длиннее ${MAX_PRODUCT_TITLE_LENGTH} символов` },
      { status: 400 }
    );
  }
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(body.slug != null && { slug: body.slug }),
      ...(body.title != null && { title: body.title }),
      ...(body.shortDesc != null && { shortDesc: body.shortDesc }),
      ...(body.categoryId != null && { category: { connect: { id: body.categoryId } } }),
      ...(body.price != null && { price: Math.round(body.price) }),
      ...(body.oldPrice != null && { oldPrice: body.oldPrice === "" ? null : Math.round(body.oldPrice) }),
      ...(body.isNew != null && { isNew: !!body.isNew }),
      ...(body.isPromo != null && { isPromo: !!body.isPromo }),
      ...(body.isBestseller != null && { isBestseller: !!body.isBestseller }),
      ...(body.skinTypes != null && { skinTypes: Array.isArray(body.skinTypes) ? body.skinTypes : [] }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl?.trim() || null }),
      ...(body.imageUrls !== undefined && {
        imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls.map((u: string) => String(u).trim()).filter(Boolean) : [],
      }),
      ...(body.imageFocusX !== undefined && { imageFocusX: body.imageFocusX == null ? null : Math.max(0, Math.min(100, Number(body.imageFocusX))) }),
      ...(body.imageFocusY !== undefined && { imageFocusY: body.imageFocusY == null ? null : Math.max(0, Math.min(100, Number(body.imageFocusY))) }),
      ...(body.composition !== undefined && { composition: body.composition?.trim() || null }),
      ...(body.components !== undefined && { components: body.components?.trim() || null }),
      ...(body.extraField1 !== undefined && { extraField1: body.extraField1?.trim() || null }),
      ...(body.extraField2 !== undefined && { extraField2: body.extraField2?.trim() || null }),
      ...(body.featuredSortOrder !== undefined && {
        featuredSortOrder: body.featuredSortOrder === null || body.featuredSortOrder === "" ? null : Math.max(0, Math.floor(Number(body.featuredSortOrder))),
      }),
      ...(body.articleCode !== undefined && { articleCode: body.articleCode?.trim() || null }),
      ...(body.problemText !== undefined && { problemText: body.problemText?.trim() || null }),
      ...(body.careStageText !== undefined && { careStageText: body.careStageText?.trim() || null }),
      ...(body.skinTypesLine !== undefined && { skinTypesLine: body.skinTypesLine?.trim() || null }),
      ...(body.scientistsTitle !== undefined && { scientistsTitle: body.scientistsTitle?.trim() || null }),
      ...(body.researchLinks !== undefined && {
        researchLinks:
          Array.isArray(body.researchLinks) && body.researchLinks.length > 0
            ? body.researchLinks
                .filter((x: { label?: string }) => x && typeof x.label === "string" && x.label.trim())
                .map((x: { label: string; url?: string }) => ({
                  label: String(x.label).trim(),
                  ...(x.url?.trim() ? { url: String(x.url).trim() } : {}),
                }))
            : [],
      }),
      ...(body.forWhatText !== undefined && { forWhatText: body.forWhatText?.trim() || null }),
      ...(body.howItWorksLines !== undefined && {
        howItWorksLines:
          Array.isArray(body.howItWorksLines) && body.howItWorksLines.length > 0
            ? (body.howItWorksLines as string[]).map((s) => String(s).trim()).filter(Boolean)
            : [],
      }),
      ...(body.howToUseText !== undefined && { howToUseText: body.howToUseText?.trim() || null }),
      ...(body.inciText !== undefined && { inciText: body.inciText?.trim() || null }),
      ...(body.volumeText !== undefined && { volumeText: body.volumeText?.trim() || null }),
      ...(body.shelfLifeText !== undefined && { shelfLifeText: body.shelfLifeText?.trim() || null }),
      ...(body.countryText !== undefined && { countryText: body.countryText?.trim() || null }),
      ...(body.inStock !== undefined && { inStock: !!body.inStock }),
      ...(body.linkWildberries !== undefined && { linkWildberries: parseMarketplaceUrl(body.linkWildberries) }),
      ...(body.linkOzon !== undefined && { linkOzon: parseMarketplaceUrl(body.linkOzon) }),
      ...(body.linkYandexMarket !== undefined && { linkYandexMarket: parseMarketplaceUrl(body.linkYandexMarket) }),
      ...(body.dermatologistVideoUrl !== undefined && {
        dermatologistVideoUrl: parseDermatologistVideoUrl(body.dermatologistVideoUrl),
      }),
    },
  });
  return NextResponse.json(product);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
