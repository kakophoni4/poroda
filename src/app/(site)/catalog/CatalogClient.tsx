"use client";

import type { ReadonlyURLSearchParams } from "next/navigation";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getProductImages, type Product, type CatalogCategory } from "@/lib/catalog-data";
import { useCart } from "@/context/CartContext";
import { useSiteCopy } from "@/context/SiteCopyContext";
import { catalogDisplayTitle, catalogDescriptionLineClamp } from "@/lib/product-title";

const categoryToFolder: Record<string, number> = { cleansing: 1, toners: 2, serums: 3, creams: 4, masks: 5, sets: 6 };
const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 48;

function ProductCard({
  p,
  cardIndex,
  totalCards,
  swapTick,
}: {
  p: Product;
  cardIndex: number;
  totalCards: number;
  swapTick: number;
}) {
  const t = useSiteCopy();
  const { addProduct } = useCart();
  const images = getProductImages(p, `/images/poroda/${categoryToFolder[p.categorySlug] ?? 1}/1.jpg`);
  const [index, setIndex] = useState(0);
  const [addedFlash, setAddedFlash] = useState(false);
  const current = images[index % images.length] ?? images[0];
  const inStock = p.inStock !== false;

  const go = (e: React.MouseEvent, delta: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + delta + images.length) % images.length);
  };

  const titleCard = catalogDisplayTitle(p.title);
  const descClamp = catalogDescriptionLineClamp(titleCard);

  useEffect(() => {
    if (images.length <= 1 || totalCards <= 0) return;
    const groups = Math.max(1, Math.ceil(totalCards / 2));
    const activeGroup = swapTick % groups;
    const myGroup = Math.floor(cardIndex / 2);
    if (activeGroup !== myGroup) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIndex((i) => (i + 1) % images.length);
  }, [swapTick, cardIndex, totalCards, images.length]);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    addProduct(
      { id: p.id, slug: p.slug, title: p.title, price: p.price, inStock: p.inStock !== false },
      1
    );
    setAddedFlash(true);
    window.setTimeout(() => setAddedFlash(false), 2000);
  };

  return (
    <div
      className={`liquidGlass-dock group flex h-full min-h-0 flex-col rounded-3xl overflow-hidden transition-premium border border-white/40 ${
        inStock ? "" : "opacity-60"
      }`}
    >
      <Link href={`/catalog/${p.slug}`} className="flex min-h-0 flex-1 flex-col">
        <div className="relative aspect-square w-full overflow-hidden">
          {current ? (
            <>
              <Image
                src={current}
                alt=""
                fill
                sizes="(max-width: 1024px) 33vw, 25vw"
                quality={82}
                className="object-cover [transform:translateZ(0)] transition-transform duration-300 ease-out will-change-transform group-hover:scale-[1.02]"
                style={{ objectPosition: `${p.imageFocusX ?? 50}% ${p.imageFocusY ?? 50}%` }}
                unoptimized={current.startsWith("/uploads/")}
              />
              {(p.isNew || p.oldPrice) && (
                <div
                  className="pointer-events-none absolute left-0 top-0 z-[5] h-16 w-16 overflow-hidden sm:h-[4.75rem] sm:w-[4.75rem]"
                  aria-hidden
                >
                  {p.isNew && (
                    <div className="absolute left-[-38%] top-[14%] w-[140%] -rotate-45 border border-white/25 bg-zinc-900 py-0.5 text-center shadow-[0_2px_10px_rgba(0,0,0,0.35)]">
                      <span className="block text-[7px] font-extrabold uppercase tracking-[0.2em] text-white sm:text-[8px] sm:tracking-[0.25em]">
                        {t("catalog.badge_new")}
                      </span>
                    </div>
                  )}
                  {p.oldPrice && (
                    <div
                      className={`absolute left-[-38%] w-[140%] -rotate-45 border border-white/30 bg-amber-500 py-0.5 text-center shadow-[0_2px_10px_rgba(180,83,9,0.45)] ${
                        p.isNew ? "top-[38%]" : "top-[14%]"
                      }`}
                    >
                      <span className="block text-[7px] font-extrabold uppercase tracking-wide text-white sm:text-[8px]">
                        {t("catalog.badge_sale")}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => go(e, -1)}
                    className="absolute left-1 top-1/2 z-10 -translate-y-1/2 p-0 text-white/90 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
                    aria-label={t("catalog.prev_photo")}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => go(e, 1)}
                    className="absolute right-1 top-1/2 z-10 -translate-y-1/2 p-0 text-white/90 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
                    aria-label={t("catalog.next_photo")}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIndex(i);
                        }}
                        className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-white" : "w-1.5 bg-white/60"}`}
                        aria-label={`Фото ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="grid-lines h-full w-full" />
          )}
        </div>
        <div className="flex min-h-0 flex-1 flex-col p-2.5 sm:p-4 md:p-5">
          <h2 className="min-h-[2.5rem] text-center text-xs font-semibold leading-snug text-zinc-900 line-clamp-2 group-hover:underline sm:min-h-[2.75rem] sm:text-sm">
            {titleCard}
          </h2>
          <p
            className={`mt-1 min-h-[2.25rem] text-center text-[10px] leading-relaxed text-zinc-600 sm:min-h-[2.5rem] sm:text-xs ${
              descClamp === 1 ? "line-clamp-1" : "line-clamp-2"
            }`}
          >
            {p.shortDesc || "\u00a0"}
          </p>
          <p className="mt-2 min-h-[1.125rem] text-center text-[10px] leading-tight text-zinc-500 line-clamp-1 sm:text-[11px]">
            {p.skinTypes && p.skinTypes.length > 0 ? `Для ${p.skinTypes.join(", ")}` : "\u00a0"}
          </p>
        </div>
      </Link>
      <div className="flex shrink-0 flex-col gap-2 border-t border-zinc-900/10 px-2.5 pb-2.5 pt-2 sm:px-4 sm:pb-4 sm:pt-3 md:px-5">
        <div className="flex w-full flex-col gap-1.5">
          {!inStock && (
            <span className="w-fit self-center rounded-full bg-zinc-200/90 px-2.5 py-0.5 text-center text-[9px] font-medium text-zinc-600 sm:text-[10px]">
              {t("catalog.out_of_stock")}
            </span>
          )}
          <div className="flex items-end justify-between gap-2">
            <div className="flex min-h-[2.85rem] min-w-0 flex-col justify-end gap-0.5 tabular-nums">
              {p.oldPrice ? (
                <span className="text-[9px] font-medium leading-tight text-zinc-400 line-through sm:text-[10px]">
                  {p.oldPrice.toLocaleString("ru-RU")} ₽
                </span>
              ) : (
                <span className="h-[11px] shrink-0 sm:h-3" aria-hidden />
              )}
              <span className="text-sm font-semibold leading-tight text-zinc-900 sm:text-base">
                {p.price.toLocaleString("ru-RU")} ₽
              </span>
            </div>
            {inStock ? (
              <button
                type="button"
                onClick={handleAdd}
                className={`shrink-0 self-end rounded-xl px-3 py-1.5 text-[10px] font-semibold transition sm:text-xs ${
                  addedFlash ? "bg-emerald-600 text-white" : "bg-zinc-900 text-white hover:bg-zinc-800"
                }`}
              >
                {addedFlash ? t("catalog.card_added_done") : t("catalog.card_add")}
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="shrink-0 cursor-not-allowed self-end rounded-xl border border-zinc-300/80 bg-zinc-200/80 px-3 py-1.5 text-[10px] font-semibold text-zinc-500 sm:text-xs"
              >
                {t("catalog.out_of_stock")}
              </button>
            )}
          </div>
        </div>
        <Link
          href={`/catalog/${p.slug}`}
          className="block text-center text-[10px] font-medium text-zinc-500 hover:text-zinc-900 sm:text-xs"
        >
          {t("catalog.card_detail")}
        </Link>
      </div>
    </div>
  );
}

export type CatalogFilter = "all" | "promo" | "new" | "bestseller";

type ApiPayload = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

type Props = {
  dataSource: "static" | "db";
  staticProductList: Product[];
  categories: CatalogCategory[];
};

function positionsPhrase(n: number, t: (k: string) => string): string {
  if (n === 0) return t("catalog.empty");
  const mod10 = n % 10;
  const mod100 = n % 100;
  let w = t("catalog.word_many");
  if (mod100 < 11 || mod100 > 14) {
    if (mod10 === 1) w = t("catalog.word_one");
    else if (mod10 >= 2 && mod10 <= 4) w = t("catalog.word_few");
  }
  return `${t("catalog.count_intro")} ${n} ${w}`;
}

/** Локальная пагинация/фильтрация без БД (короткий dev-фоллбек, ~десятки позиций). */
function computeStaticPage(staticProductList: Product[], sp: ReadonlyURLSearchParams | URLSearchParams): ApiPayload {
  const all = sp.get("all");
  const categorySlug = sp.get("category")?.trim() || null;
  const q = sp.get("q")?.trim().toLowerCase() || "";
  const minPriceRaw = sp.get("minPrice");
  const maxPriceRaw = sp.get("maxPrice");
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(Number(sp.get("limit")) || DEFAULT_PAGE_SIZE)));
  const page = Math.max(1, Math.floor(Number(sp.get("page")) || 1));
  const sort = sp.get("sort") || "createdAt_desc";
  const filter = (sp.get("filter") as CatalogFilter) || "all";
  const valid: CatalogFilter =
    filter === "promo" || filter === "new" || filter === "bestseller" ? filter : "all";

  const list: Product[] = staticProductList.filter((p) => {
    if ((p as { archivedAt?: string | null }).archivedAt) return false;
    if (all === "1") return true;
    if (p.inStock === false) return false;
    if (valid === "promo" && !((p as { isPromo?: boolean }).isPromo || p.oldPrice)) return false;
    if (valid === "new" && !p.isNew) return false;
    if (valid === "bestseller" && !(p as { isBestseller?: boolean }).isBestseller) return false;
    if (categorySlug && p.categorySlug !== categorySlug) return false;
    if (q) {
      const ti = p.title.toLowerCase();
      const s = (p.shortDesc || "").toLowerCase();
      if (!ti.includes(q) && !s.includes(q)) return false;
    }
    const minP = minPriceRaw != null && minPriceRaw !== "" ? Number(minPriceRaw) : null;
    const maxP = maxPriceRaw != null && maxPriceRaw !== "" ? Number(maxPriceRaw) : null;
    if (minP != null && Number.isFinite(minP) && p.price < minP) return false;
    if (maxP != null && Number.isFinite(maxP) && p.price > maxP) return false;
    if (sort === "sale" && p.oldPrice == null) return false;
    return true;
  });

  const sorted = [...list].sort((a, b) => {
    if (sort === "price_asc" || sort === "sale") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    if (sort === "title_asc") return a.title.localeCompare(b.title, "ru");
    if (sort === "title_desc") return b.title.localeCompare(a.title, "ru");
    if (sort === "popular" || sort === "createdAt_desc" || !sort) return 0;
    if (sort === "new") return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
    return 0;
  });
  const total = sorted.length;
  const pageCount = total === 0 ? 0 : Math.ceil(total / limit);
  const safePage = pageCount > 0 ? Math.min(page, pageCount) : 1;
  const items = sorted.slice((safePage - 1) * limit, safePage * limit);
  return { items, total, page: safePage, pageSize: limit, pageCount };
}

function buildCatalogQueryString(sp: URLSearchParams): string {
  const p = new URLSearchParams(sp.toString());
  if (!p.has("limit")) p.set("limit", String(DEFAULT_PAGE_SIZE));
  for (const key of p.keys()) {
    if (p.get(key) === "" || p.get(key) == null) p.delete(key);
  }
  return p.toString();
}

type PaginatorLine = number | "…";

function visiblePageButtons(current: number, pageCount: number): PaginatorLine[] {
  if (pageCount <= 0) return [];
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, "…", pageCount] as const;
  }
  if (current >= pageCount - 2) {
    return [1, "…", pageCount - 2, pageCount - 1, pageCount] as const;
  }
  return [1, "…", current - 1, current, current + 1, "…", pageCount] as const;
}

function CatalogPagination({
  page,
  pageCount,
  pathname,
  sp,
  router,
}: {
  page: number;
  pageCount: number;
  pathname: string;
  sp: ReturnType<typeof useSearchParams>;
  router: ReturnType<typeof useRouter>;
}) {
  if (pageCount <= 1) return null;
  const setPage = (next: number) => {
    if (next < 1 || next > pageCount) return;
    const p = new URLSearchParams(sp.toString());
    p.set("page", String(next));
    router.push(`${pathname}?${p.toString()}`, { scroll: false });
  };
  const buttons = visiblePageButtons(page, pageCount);
  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-1" aria-label="Страницы каталога">
      <button
        type="button"
        onClick={() => setPage(page - 1)}
        disabled={page <= 1}
        className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-800 disabled:opacity-40"
      >
        Назад
      </button>
      {buttons.map((b, i) => {
        if (b === "…") {
          return (
            <span key={`e-${i}`} className="px-0.5 text-sm text-zinc-400" aria-hidden>
              …
            </span>
          );
        }
        const active = b === page;
        if (active) {
          return (
            <span
              key={b}
              className="rounded-lg border border-zinc-900 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
              aria-current="page"
            >
              {b}
            </span>
          );
        }
        return (
          <button
            type="button"
            key={b}
            onClick={() => setPage(b)}
            className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-800 hover:border-zinc-400"
          >
            {b}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => setPage(page + 1)}
        disabled={page >= pageCount}
        className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-800 disabled:opacity-40"
      >
        Вперёд
      </button>
    </nav>
  );
}

export default function CatalogClient({ dataSource, staticProductList, categories }: Props) {
  void categories;
  const t = useSiteCopy();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [swapTick, setSwapTick] = useState(0);
  const [apiState, setApiState] = useState<"loading" | "ok" | "err">(
    () => (dataSource === "db" ? "loading" : "ok"),
  );
  const [apiData, setApiData] = useState<ApiPayload | null>(null);

  const qKey = searchParams.toString();
  const staticData = useMemo(
    () => computeStaticPage(staticProductList, searchParams),
    [staticProductList, searchParams],
  );

  useEffect(() => {
    const id = window.setInterval(() => setSwapTick((x) => x + 1), 10000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (dataSource === "static") return;
    const ab = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- индикатор «идёт запрос к API» при смене query
    setApiState("loading");
    const qs = buildCatalogQueryString(searchParams);
    fetch(`/api/products?${qs}`, { signal: ab.signal, cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("bad");
        return res.json() as Promise<ApiPayload>;
      })
      .then((d) => {
        if (ab.signal.aborted) return;
        if (d == null || !Array.isArray(d.items)) throw new Error("shape");
        setApiData(d);
        setApiState("ok");
      })
      .catch(() => {
        if (ab.signal.aborted) return;
        if (staticProductList.length > 0) {
          setApiData(computeStaticPage(staticProductList, searchParams));
          setApiState("ok");
        } else {
          setApiData(null);
          setApiState("err");
        }
      });
    return () => ab.abort();
  }, [dataSource, qKey, searchParams, staticProductList]);

  const result: ApiPayload | null = dataSource === "static" ? staticData : apiData;
  const isLoading = dataSource === "db" && apiState === "loading";

  const filterParam = (searchParams.get("filter") as CatalogFilter) || "all";
  const validFilter: CatalogFilter =
    filterParam === "promo" || filterParam === "new" || filterParam === "bestseller" ? filterParam : "all";

  const filterUrl = (f: CatalogFilter) => {
    const u = new URLSearchParams(searchParams);
    if (f === "all") u.delete("filter");
    else u.set("filter", f);
    u.delete("per_page");
    u.delete("sort");
    u.set("page", "1");
    return `/catalog?${u.toString()}`;
  };

  const filterTabs: { value: CatalogFilter; label: string }[] = useMemo(
    () => [
      { value: "all" as const, label: t("catalog.tab_all") },
      { value: "promo" as const, label: t("catalog.tab_promo") },
      { value: "new" as const, label: t("catalog.tab_new") },
      { value: "bestseller" as const, label: t("catalog.tab_bestseller") },
    ],
    [t],
  );

  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const page = result?.page ?? 1;
  const pageCount = result?.pageCount ?? 0;

  return (
    <div>
      <div className="mb-2 flex flex-wrap justify-center gap-1.5 sm:gap-2">
        {filterTabs.map((tab) => (
          <Link
            key={tab.value}
            href={filterUrl(tab.value)}
            className={`text-xs font-medium transition-colors sm:text-sm ${
              validFilter === tab.value
                ? "rounded-xl border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-white sm:px-3.5"
                : "rounded-lg px-2.5 py-1.5 text-zinc-700 underline decoration-transparent underline-offset-4 hover:text-zinc-900 hover:decoration-zinc-400 sm:px-3"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {apiState === "err" && <p className="mb-4 text-sm text-red-600">Не удалось загрузить каталог.</p>}

      {isLoading ? (
        <div className="mt-2 grid grid-cols-3 gap-2 sm:mt-3 sm:gap-3 md:gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="liquidGlass-dock h-64 rounded-3xl animate-pulse border border-white/40" />
          ))}
        </div>
      ) : (
        <div className="mt-2 grid grid-cols-3 gap-2 sm:mt-3 sm:gap-3 md:gap-4 lg:grid-cols-4">
          {items.map((p, i) => (
            <ProductCard key={p.id} p={p} cardIndex={i} totalCards={items.length} swapTick={swapTick} />
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <CatalogPagination
          page={page}
          pageCount={pageCount}
          pathname={pathname}
          sp={searchParams}
          router={router}
        />
      )}

      <p className="mt-6 text-sm text-zinc-500">
        {apiState === "err" && staticProductList.length === 0 ? t("catalog.empty") : positionsPhrase(total, t)}
      </p>
    </div>
  );
}
