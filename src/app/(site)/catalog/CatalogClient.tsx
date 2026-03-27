"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getProductImages, type Product, type CatalogCategory } from "@/lib/catalog-data";
import { useCart } from "@/context/CartContext";
import { useSiteCopy } from "@/context/SiteCopyContext";
import { catalogDisplayTitle, catalogDescriptionLineClamp } from "@/lib/product-title";

const categoryToFolder: Record<string, number> = { cleansing: 1, toners: 2, serums: 3, creams: 4, masks: 5, sets: 6 };

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
    setIndex((i) => (i + 1) % images.length);
  }, [swapTick, cardIndex, totalCards, images.length]);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    addProduct({ id: p.id, slug: p.slug, title: p.title, price: p.price }, 1);
    setAddedFlash(true);
    window.setTimeout(() => setAddedFlash(false), 2000);
  };

  return (
    <div className="liquidGlass-dock group flex h-full min-h-0 flex-col rounded-3xl overflow-hidden transition-premium border border-white/40">
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
            <span className="shrink-0 self-end text-[10px] text-zinc-400 sm:text-xs">{t("catalog.out_of_stock")}</span>
          )}
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

type Props = { initialProducts: Product[]; categories: CatalogCategory[] };

export type CatalogFilter = "all" | "promo" | "new" | "bestseller";

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

export default function CatalogClient({ initialProducts, categories: _categories }: Props) {
  const t = useSiteCopy();
  const searchParams = useSearchParams();
  const [swapTick, setSwapTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setSwapTick((t) => t + 1), 10000);
    return () => window.clearInterval(id);
  }, []);

  const filterParam = (searchParams.get("filter") as CatalogFilter) || "all";
  const validFilter: CatalogFilter =
    filterParam === "promo" || filterParam === "new" || filterParam === "bestseller" ? filterParam : "all";
  const categorySlug = searchParams.get("category") ?? null;

  const filtered = useMemo(() => {
    let list = [...initialProducts];
    if (validFilter === "promo") list = list.filter((p) => p.isPromo || p.oldPrice);
    else if (validFilter === "new") list = list.filter((p) => p.isNew);
    else if (validFilter === "bestseller") list = list.filter((p) => p.isBestseller);
    if (categorySlug) list = list.filter((p) => p.categorySlug === categorySlug);
    return list;
  }, [initialProducts, validFilter, categorySlug]);

  const filterUrl = (f: CatalogFilter) => {
    const u = new URLSearchParams(searchParams);
    if (f === "all") u.delete("filter");
    else u.set("filter", f);
    u.delete("per_page");
    u.delete("sort");
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

      <div className="mt-2 grid grid-cols-3 gap-2 sm:mt-3 sm:gap-3 md:gap-4 lg:grid-cols-4">
        {filtered.map((p, i) => (
          <ProductCard key={p.id} p={p} cardIndex={i} totalCards={filtered.length} swapTick={swapTick} />
        ))}
      </div>

      <p className="mt-6 text-sm text-zinc-500">{positionsPhrase(filtered.length, t)}</p>
    </div>
  );
}
