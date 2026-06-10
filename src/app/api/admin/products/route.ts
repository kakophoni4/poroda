import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { parseAdminListPagination, totalPages } from "@/lib/admin-list-pagination";
import { prisma } from "@/lib/db";
import { MAX_PRODUCT_TITLE_LENGTH } from "@/lib/product-title";
import { parseMarketplaceUrl } from "@/lib/marketplace-links";
import { DERMATOLOGIST_VIDEO_INVALID_MESSAGE, parseDermatologistVideoUrl } from "@/lib/dermatologist-video";
import { sanitizeConcernIds } from "@/lib/concern-catalog";
import {
  nullIfEmptyRich,
  sanitizePlainString,
  sanitizeRichTextLines,
  sanitizeStringList,
  sanitizeText,
} from "@/lib/sanitize";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { page, limit, skip } = parseAdminListPagination(new URL(request.url).searchParams);
  const [total, data] = await Promise.all([
    prisma.product.count(),
    prisma.product.findMany({
      skip,
      take: limit,
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
      include: { category: true },
    }),
  ]);
  return NextResponse.json({
    data,
    total,
    page,
    limit,
    totalPages: totalPages(total, limit),
  });
}

export async function POST(request: NextRequest) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const {
    slug,
    title,
    shortDesc,
    categoryId,
    price,
    oldPrice,
    isNew,
    isPromo,
    isBestseller,
    skinTypes,
    imageUrl,
    imageUrls,
    imageFocusX,
    imageFocusY,
    composition,
    components,
    extraField1,
    extraField2,
    featuredSortOrder,
    articleCode,
    problemText,
    careStageText,
    skinTypesLine,
    scientistsTitle,
    researchLinks,
    forWhatText,
    howItWorksLines,
    howToUseText,
    inciText,
    volumeText,
    shelfLifeText,
    countryText,
    inStock,
    linkWildberries,
    linkOzon,
    linkYandexMarket,
    linkGoldApple,
    linkLetual,
    concernIds,
    dermatologistVideoUrl,
  } = body as {
    slug: string;
    title: string;
    shortDesc?: string;
    categoryId: string;
    price: number;
    oldPrice?: number;
    isNew?: boolean;
    isPromo?: boolean;
    isBestseller?: boolean;
    skinTypes?: string[];
    imageUrl?: string;
    imageUrls?: string[];
    imageFocusX?: number | null;
    imageFocusY?: number | null;
    composition?: string;
    components?: string;
    extraField1?: string;
    extraField2?: string;
    featuredSortOrder?: number | string | null;
    articleCode?: string;
    problemText?: string;
    careStageText?: string;
    skinTypesLine?: string;
    scientistsTitle?: string;
    researchLinks?: { label: string; url?: string }[];
    forWhatText?: string;
    howItWorksLines?: string[];
    howToUseText?: string;
    inciText?: string;
    volumeText?: string;
    shelfLifeText?: string;
    countryText?: string;
    inStock?: boolean;
    linkWildberries?: string;
    linkOzon?: string;
    linkYandexMarket?: string;
    linkGoldApple?: string;
    linkLetual?: string;
    concernIds?: string[];
    dermatologistVideoUrl?: string;
  };
  if (!slug || !title || !categoryId || price == null) {
    return NextResponse.json({ error: "slug, title, categoryId, price обязательны" }, { status: 400 });
  }
  if (dermatologistVideoUrl != null && String(dermatologistVideoUrl).trim() !== "" && !parseDermatologistVideoUrl(dermatologistVideoUrl)) {
    return NextResponse.json({ error: DERMATOLOGIST_VIDEO_INVALID_MESSAGE }, { status: 400 });
  }
  const titleTrim = sanitizePlainString(String(title)).trim();
  if (titleTrim.length > MAX_PRODUCT_TITLE_LENGTH) {
    return NextResponse.json(
      { error: `Название не длиннее ${MAX_PRODUCT_TITLE_LENGTH} символов` },
      { status: 400 }
    );
  }
  const slugSafe = sanitizeText(String(slug).trim(), 200);
  const urls = Array.isArray(imageUrls) ? imageUrls.map((u) => String(u).trim()).filter(Boolean) : [];
  const focusX = imageFocusX != null ? Math.max(0, Math.min(100, Number(imageFocusX))) : null;
  const focusY = imageFocusY != null ? Math.max(0, Math.min(100, Number(imageFocusY))) : null;
  const product = await prisma.product.create({
    data: {
      slug: slugSafe,
      title: titleTrim,
      shortDesc: nullIfEmptyRich(shortDesc),
      categoryId,
      price: Math.round(price),
      oldPrice: oldPrice != null ? Math.round(oldPrice) : null,
      isNew: !!isNew,
      isPromo: !!isPromo,
      isBestseller: !!isBestseller,
      skinTypes: sanitizeStringList(skinTypes),
      concernIds: sanitizeConcernIds(concernIds),
      imageUrl: imageUrl?.trim() || urls[0] || null,
      imageUrls: urls,
      imageFocusX: focusX,
      imageFocusY: focusY,
      composition: nullIfEmptyRich(composition),
      components: nullIfEmptyRich(components),
      extraField1: nullIfEmptyRich(extraField1),
      extraField2: nullIfEmptyRich(extraField2),
      featuredSortOrder: featuredSortOrder != null && String(featuredSortOrder).trim() !== "" ? Math.max(0, Math.floor(Number(featuredSortOrder))) : null,
      articleCode: articleCode?.trim() ? sanitizeText(articleCode.trim(), 80) : null,
      problemText: nullIfEmptyRich(problemText),
      careStageText: nullIfEmptyRich(careStageText),
      skinTypesLine: nullIfEmptyRich(skinTypesLine),
      scientistsTitle: nullIfEmptyRich(scientistsTitle),
      researchLinks:
        Array.isArray(researchLinks) && researchLinks.length > 0
          ? researchLinks
              .filter((x) => x?.label?.trim())
              .map((x) => ({
                label: sanitizeText(String(x.label), 200).trim(),
                ...(x.url?.trim() ? { url: String(x.url).trim() } : {}),
              }))
          : [],
      forWhatText: nullIfEmptyRich(forWhatText),
      howItWorksLines: sanitizeRichTextLines(howItWorksLines),
      howToUseText: nullIfEmptyRich(howToUseText),
      inciText: nullIfEmptyRich(inciText),
      volumeText: nullIfEmptyRich(volumeText),
      shelfLifeText: nullIfEmptyRich(shelfLifeText),
      countryText: nullIfEmptyRich(countryText),
      inStock: inStock !== false,
      linkWildberries: parseMarketplaceUrl(linkWildberries),
      linkOzon: parseMarketplaceUrl(linkOzon),
      linkYandexMarket: parseMarketplaceUrl(linkYandexMarket),
      linkGoldApple: parseMarketplaceUrl(linkGoldApple),
      linkLetual: parseMarketplaceUrl(linkLetual),
      dermatologistVideoUrl: parseDermatologistVideoUrl(dermatologistVideoUrl),
    },
  });
  return NextResponse.json(product);
}
