import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const categoryToFolder: Record<string, number> = { cleansing: 1, toners: 2, serums: 3, creams: 4, masks: 5, sets: 6 };
const defaultImg = (catSlug: string) => `/images/poroda/${categoryToFolder[catSlug] ?? 1}/1.jpg`;

const MAX_PAGE_SIZE = 48;
const DEFAULT_PAGE_SIZE = 24;

type SortKey =
  | "price_asc"
  | "price_desc"
  | "title_asc"
  | "title_desc"
  | "createdAt_desc"
  | "popular"
  | "new"
  | "sale"
  // legacy
  | string
  | null
  | undefined;

function getOrderBy(sort: SortKey): Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return { price: "asc" };
    case "price_desc":
      return { price: "desc" };
    case "title_asc":
      return { title: "asc" };
    case "title_desc":
      return { title: "desc" };
    case "createdAt_desc":
      return { createdAt: "desc" };
    case "popular":
      return [{ sortOrder: "asc" as const }, { id: "asc" as const }];
    case "new":
      return [{ isNew: "desc" as const }, { createdAt: "desc" as const }];
    case "sale":
      return { price: "asc" };
    default:
      return { createdAt: "desc" };
  }
}

function parseQueryToSearchParams(raw: string | null | undefined): URLSearchParams {
  const t = (raw || "").trim();
  if (!t) return new URLSearchParams();
  return new URLSearchParams(t.startsWith("?") ? t.slice(1) : t);
}

/** incoming перезаписывает base (например из карточки «проблема») */
function mergeBaseParamsWithRequest(base: URLSearchParams, incoming: URLSearchParams): URLSearchParams {
  const out = new URLSearchParams();
  for (const [k, v] of base) {
    if (k === "concern") continue;
    out.set(k, v);
  }
  for (const [k, v] of incoming) {
    if (k === "concern") continue;
    out.set(k, v);
  }
  return out;
}

const VALID_FILTER = new Set(["all", "promo", "new", "bestseller"]);

type CatalogFilter = "all" | "promo" | "new" | "bestseller";

function buildWhere(
  sp: URLSearchParams,
  sort: string | null,
  concernProductId?: string | null
): { where: Prisma.ProductWhereInput } {
  const q = sp.get("q")?.trim() || "";
  const category = sp.get("category")?.trim() || "";
  const minPriceRaw = sp.get("minPrice");
  const maxPriceRaw = sp.get("maxPrice");
  const all = sp.get("all");
  const fRaw = sp.get("filter") || "all";
  const filter: CatalogFilter = VALID_FILTER.has(fRaw) ? (fRaw as CatalogFilter) : "all";

  const and: Prisma.ProductWhereInput[] = [];

  if (sp.get("includeArchived") !== "1") {
    and.push({ archivedAt: null });
  }

  if (all !== "1") {
    and.push({ inStock: true });
  }

  if (category) {
    and.push({ category: { slug: category } });
  }

  if (concernProductId) {
    and.push({ concernIds: { has: concernProductId } });
  }

  if (q) {
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { shortDesc: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  const minPrice = minPriceRaw != null && minPriceRaw !== "" ? Number(minPriceRaw) : null;
  const maxPrice = maxPriceRaw != null && maxPriceRaw !== "" ? Number(maxPriceRaw) : null;
  const hasMin = minPrice != null && Number.isFinite(minPrice);
  const hasMax = maxPrice != null && Number.isFinite(maxPrice);
  if (hasMin || hasMax) {
    and.push({
      price: {
        ...(hasMin ? { gte: minPrice! } : {}),
        ...(hasMax ? { lte: maxPrice! } : {}),
      },
    });
  }

  if (filter === "promo") {
    and.push({ OR: [{ isPromo: true }, { oldPrice: { not: null } }] });
  } else if (filter === "new") {
    and.push({ isNew: true });
  } else if (filter === "bestseller") {
    and.push({ isBestseller: true });
  }

  if (sort === "sale") {
    and.push({ oldPrice: { not: null } });
  }

  if (and.length === 0) {
    return { where: {} };
  }
  return { where: { AND: and } };
}

function mapToJson(p: {
  id: string;
  slug: string;
  title: string;
  shortDesc: string | null;
  price: number;
  oldPrice: number | null;
  isNew: boolean;
  isPromo: boolean;
  isBestseller: boolean;
  skinTypes: string[];
  imageUrl: string | null;
  imageUrls: string[];
  imageFocusX: number | null;
  imageFocusY: number | null;
  composition: string | null;
  components: string | null;
  extraField1: string | null;
  extraField2: string | null;
  inStock: boolean;
  category: { slug: string; title: string };
}) {
  const fallback = defaultImg(p.category.slug);
  const imageUrls = p.imageUrls.length ? p.imageUrls : p.imageUrl ? [p.imageUrl] : [fallback];
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    shortDesc: p.shortDesc || undefined,
    category: p.category.title,
    categorySlug: p.category.slug,
    price: p.price,
    oldPrice: p.oldPrice ?? undefined,
    isNew: p.isNew,
    isPromo: p.isPromo,
    isBestseller: p.isBestseller,
    skinTypes: p.skinTypes,
    imageUrl: p.imageUrl ?? fallback,
    imageUrls,
    imageFocusX: p.imageFocusX ?? undefined,
    imageFocusY: p.imageFocusY ?? undefined,
    composition: p.composition ?? undefined,
    components: p.components ?? undefined,
    extraField1: p.extraField1 ?? undefined,
    extraField2: p.extraField2 ?? undefined,
    inStock: p.inStock,
  };
}

export async function GET(request: NextRequest) {
  try {
    const incoming = new URL(request.url).searchParams;
    const concernId = incoming.get("concern")?.trim() || null;

    let baseFromCard = new URLSearchParams();
    if (concernId) {
      const delegate = (prisma as { homeConcernCard?: { findUnique: (args: unknown) => Promise<{ catalogQuery: string } | null> } })
        .homeConcernCard;
      if (delegate?.findUnique) {
        const card = await delegate.findUnique({ where: { id: concernId }, select: { catalogQuery: true } });
        if (card?.catalogQuery) {
          baseFromCard = parseQueryToSearchParams(card.catalogQuery);
        }
      } else {
        const rows = await prisma.$queryRaw<{ catalogQuery: string }[]>`SELECT "catalogQuery" FROM "HomeConcernCard" WHERE id = ${concernId}`;
        if (rows[0]?.catalogQuery) {
          baseFromCard = parseQueryToSearchParams(rows[0].catalogQuery);
        }
      }
    }

    const sp = mergeBaseParamsWithRequest(baseFromCard, incoming);
    // limit/page из итоговых (вкл. карточку) параметров, но count должен ссылаться на то же, что findMany
    const page = Math.max(1, Math.floor(Number(sp.get("page")) || 1));
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(Number(sp.get("limit")) || DEFAULT_PAGE_SIZE)));
    const sort = sp.get("sort") as SortKey;

    const { where } = buildWhere(sp, sp.get("sort"), concernId);
    const orderBy = getOrderBy(sort);

    const [total, list] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: Array.isArray(orderBy) ? orderBy : [orderBy],
        include: { category: { select: { slug: true, title: true } } },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const pageCount = total === 0 ? 0 : Math.ceil(total / limit);

    return NextResponse.json({
      items: list.map(mapToJson),
      total,
      page,
      pageSize: limit,
      pageCount,
    });
  } catch (e) {
    console.error("GET /api/products:", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
