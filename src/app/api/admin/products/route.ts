import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MAX_PRODUCT_TITLE_LENGTH } from "@/lib/product-title";
import { parseMarketplaceUrl } from "@/lib/marketplace-links";
import { parseDermatologistVideoUrl } from "@/lib/dermatologist-video";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const products = await prisma.product.findMany({
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
    include: { category: { select: { slug: true, title: true } } },
  });
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
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
    dermatologistVideoUrl?: string;
  };
  if (!slug || !title || !categoryId || price == null) {
    return NextResponse.json({ error: "slug, title, categoryId, price обязательны" }, { status: 400 });
  }
  const titleTrim = String(title).trim();
  if (titleTrim.length > MAX_PRODUCT_TITLE_LENGTH) {
    return NextResponse.json(
      { error: `Название не длиннее ${MAX_PRODUCT_TITLE_LENGTH} символов` },
      { status: 400 }
    );
  }
  const urls = Array.isArray(imageUrls) ? imageUrls.map((u) => String(u).trim()).filter(Boolean) : [];
  const focusX = imageFocusX != null ? Math.max(0, Math.min(100, Number(imageFocusX))) : null;
  const focusY = imageFocusY != null ? Math.max(0, Math.min(100, Number(imageFocusY))) : null;
  const product = await prisma.product.create({
    data: {
      slug: slug.trim(),
      title: titleTrim,
      shortDesc: shortDesc?.trim() || null,
      categoryId,
      price: Math.round(price),
      oldPrice: oldPrice != null ? Math.round(oldPrice) : null,
      isNew: !!isNew,
      isPromo: !!isPromo,
      isBestseller: !!isBestseller,
      skinTypes: Array.isArray(skinTypes) ? skinTypes : [],
      imageUrl: imageUrl?.trim() || urls[0] || null,
      imageUrls: urls,
      imageFocusX: focusX,
      imageFocusY: focusY,
      composition: composition?.trim() || null,
      components: components?.trim() || null,
      extraField1: extraField1?.trim() || null,
      extraField2: extraField2?.trim() || null,
      featuredSortOrder: featuredSortOrder != null && String(featuredSortOrder).trim() !== "" ? Math.max(0, Math.floor(Number(featuredSortOrder))) : null,
      articleCode: articleCode?.trim() || null,
      problemText: problemText?.trim() || null,
      careStageText: careStageText?.trim() || null,
      skinTypesLine: skinTypesLine?.trim() || null,
      scientistsTitle: scientistsTitle?.trim() || null,
      researchLinks:
        Array.isArray(researchLinks) && researchLinks.length > 0
          ? researchLinks
              .filter((x) => x?.label?.trim())
              .map((x) => ({ label: x.label.trim(), ...(x.url?.trim() ? { url: x.url.trim() } : {}) }))
          : [],
      forWhatText: forWhatText?.trim() || null,
      howItWorksLines:
        Array.isArray(howItWorksLines) && howItWorksLines.length > 0
          ? howItWorksLines.map((s) => String(s).trim()).filter(Boolean)
          : [],
      howToUseText: howToUseText?.trim() || null,
      inciText: inciText?.trim() || null,
      volumeText: volumeText?.trim() || null,
      shelfLifeText: shelfLifeText?.trim() || null,
      countryText: countryText?.trim() || null,
      inStock: inStock !== false,
      linkWildberries: parseMarketplaceUrl(linkWildberries),
      linkOzon: parseMarketplaceUrl(linkOzon),
      linkYandexMarket: parseMarketplaceUrl(linkYandexMarket),
      dermatologistVideoUrl: parseDermatologistVideoUrl(dermatologistVideoUrl),
    },
  });
  return NextResponse.json(product);
}
