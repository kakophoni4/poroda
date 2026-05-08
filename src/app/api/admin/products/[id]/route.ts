import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { MAX_PRODUCT_TITLE_LENGTH } from "@/lib/product-title";
import { parseMarketplaceUrl } from "@/lib/marketplace-links";
import { DERMATOLOGIST_VIDEO_INVALID_MESSAGE, parseDermatologistVideoUrl } from "@/lib/dermatologist-video";
import { nullIfEmptyRich, sanitizePlainString, sanitizeRichTextLines, sanitizeStringList, sanitizeText } from "@/lib/sanitize";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  if (body.title != null) {
    const titleSan = sanitizePlainString(String(body.title)).trim();
    if (titleSan.length > MAX_PRODUCT_TITLE_LENGTH) {
      return NextResponse.json(
        { error: `Название не длиннее ${MAX_PRODUCT_TITLE_LENGTH} символов` },
        { status: 400 }
      );
    }
  }
  if (body.dermatologistVideoUrl !== undefined) {
    const derm = body.dermatologistVideoUrl;
    if (derm != null && String(derm).trim() !== "" && !parseDermatologistVideoUrl(derm)) {
      return NextResponse.json({ error: DERMATOLOGIST_VIDEO_INVALID_MESSAGE }, { status: 400 });
    }
  }
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(body.slug != null && { slug: sanitizeText(String(body.slug), 200) }),
      ...(body.title != null && { title: sanitizePlainString(String(body.title)).trim() }),
      ...(body.shortDesc != null && { shortDesc: nullIfEmptyRich(body.shortDesc) }),
      ...(body.categoryId != null && { category: { connect: { id: body.categoryId } } }),
      ...(body.price != null && { price: Math.round(body.price) }),
      ...(body.oldPrice != null && { oldPrice: body.oldPrice === "" ? null : Math.round(body.oldPrice) }),
      ...(body.isNew != null && { isNew: !!body.isNew }),
      ...(body.isPromo != null && { isPromo: !!body.isPromo }),
      ...(body.isBestseller != null && { isBestseller: !!body.isBestseller }),
      ...(body.skinTypes != null && { skinTypes: sanitizeStringList(body.skinTypes) }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl?.trim() || null }),
      ...(body.imageUrls !== undefined && {
        imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls.map((u: string) => String(u).trim()).filter(Boolean) : [],
      }),
      ...(body.imageFocusX !== undefined && { imageFocusX: body.imageFocusX == null ? null : Math.max(0, Math.min(100, Number(body.imageFocusX))) }),
      ...(body.imageFocusY !== undefined && { imageFocusY: body.imageFocusY == null ? null : Math.max(0, Math.min(100, Number(body.imageFocusY))) }),
      ...(body.composition !== undefined && { composition: nullIfEmptyRich(body.composition) }),
      ...(body.components !== undefined && { components: nullIfEmptyRich(body.components) }),
      ...(body.extraField1 !== undefined && { extraField1: nullIfEmptyRich(body.extraField1) }),
      ...(body.extraField2 !== undefined && { extraField2: nullIfEmptyRich(body.extraField2) }),
      ...(body.featuredSortOrder !== undefined && {
        featuredSortOrder: body.featuredSortOrder === null || body.featuredSortOrder === "" ? null : Math.max(0, Math.floor(Number(body.featuredSortOrder))),
      }),
      ...(body.articleCode !== undefined && {
        articleCode: body.articleCode?.trim() ? sanitizeText(String(body.articleCode).trim(), 80) : null,
      }),
      ...(body.problemText !== undefined && { problemText: nullIfEmptyRich(body.problemText) }),
      ...(body.careStageText !== undefined && { careStageText: nullIfEmptyRich(body.careStageText) }),
      ...(body.skinTypesLine !== undefined && { skinTypesLine: nullIfEmptyRich(body.skinTypesLine) }),
      ...(body.scientistsTitle !== undefined && { scientistsTitle: nullIfEmptyRich(body.scientistsTitle) }),
      ...(body.researchLinks !== undefined && {
        researchLinks:
          Array.isArray(body.researchLinks) && body.researchLinks.length > 0
            ? body.researchLinks
                .filter((x: { label?: string }) => x && typeof x.label === "string" && x.label.trim())
                .map((x: { label: string; url?: string }) => ({
                  label: sanitizeText(String(x.label), 200).trim(),
                  ...(x.url?.trim() ? { url: String(x.url).trim() } : {}),
                }))
            : [],
      }),
      ...(body.forWhatText !== undefined && { forWhatText: nullIfEmptyRich(body.forWhatText) }),
      ...(body.howItWorksLines !== undefined && { howItWorksLines: sanitizeRichTextLines(body.howItWorksLines as string[]) }),
      ...(body.howToUseText !== undefined && { howToUseText: nullIfEmptyRich(body.howToUseText) }),
      ...(body.inciText !== undefined && { inciText: nullIfEmptyRich(body.inciText) }),
      ...(body.volumeText !== undefined && { volumeText: nullIfEmptyRich(body.volumeText) }),
      ...(body.shelfLifeText !== undefined && { shelfLifeText: nullIfEmptyRich(body.shelfLifeText) }),
      ...(body.countryText !== undefined && { countryText: nullIfEmptyRich(body.countryText) }),
      ...(body.inStock !== undefined && { inStock: !!body.inStock }),
      ...(body.linkWildberries !== undefined && { linkWildberries: parseMarketplaceUrl(body.linkWildberries) }),
      ...(body.linkOzon !== undefined && { linkOzon: parseMarketplaceUrl(body.linkOzon) }),
      ...(body.linkYandexMarket !== undefined && { linkYandexMarket: parseMarketplaceUrl(body.linkYandexMarket) }),
      ...(body.dermatologistVideoUrl !== undefined && {
        dermatologistVideoUrl: parseDermatologistVideoUrl(body.dermatologistVideoUrl),
      }),
      ...(body.archivedAt !== undefined && {
        archivedAt: body.archivedAt === null || body.archivedAt === "" ? null : new Date(String(body.archivedAt)),
      }),
    },
  });
  return NextResponse.json(product);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const now = new Date();
  const product = await prisma.product.update({
    where: { id },
    data: { archivedAt: now, inStock: false },
    include: { category: true },
  });
  return NextResponse.json({
    ok: true,
    action: "archived" as const,
    message:
      "Позиция заархивирована: снята с витрины, недоступна в каталоге; история заказов с этой позицией сохраняется. Полное удаление из БД — вручную, только если нет ссылок из заказов.",
    product,
  });
}
