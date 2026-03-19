"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import type { FeaturedProduct } from "@/lib/featured-products";
import { useCart } from "@/context/CartContext";
import { catalogDisplayTitle } from "@/lib/product-title";

const GAP = 12; // gap-3
const MIN_CARD = 200;
const MIN_CARD_SM = 240;

type Props = { products: FeaturedProduct[] };

function FeaturedCard({
  p,
  scrollMode,
  cardWidthPx,
}: {
  p: FeaturedProduct;
  scrollMode: boolean;
  cardWidthPx: number | null;
}) {
  const { addProduct } = useCart();
  const [added, setAdded] = useState(false);
  const titleCard = catalogDisplayTitle(p.title);
  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addProduct({ id: p.id, slug: p.slug, title: p.title, price: p.price }, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div
      className={
        scrollMode && cardWidthPx != null
          ? "flex shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-white/35 bg-transparent"
          : "flex min-w-0 flex-1 basis-0 flex-col overflow-hidden rounded-2xl border border-white/35 bg-transparent"
      }
      style={scrollMode && cardWidthPx != null ? { width: cardWidthPx, flex: "0 0 auto" } : undefined}
    >
      <Link href={`/catalog/${p.slug}`} className="group flex min-h-0 flex-1 flex-col">
        <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-t-2xl bg-transparent">
          <img
            src={p.imageUrl}
            alt=""
            className="h-full w-full object-cover [transform:translateZ(0)] transition-transform duration-300 ease-out will-change-transform group-hover:scale-[1.02]"
          />
        </div>
        <div className="flex flex-col gap-1 bg-white/60 px-3 pb-2 pt-2.5 backdrop-blur-[2px] sm:gap-1.5 sm:px-3.5 sm:pb-2.5 sm:pt-3">
          {/* Ровная сетка: 2 строки заголовка + 3 строки описания — у всех карточек одинаковая вертикаль */}
          <div className="flex min-h-[2.0625rem] flex-col justify-start sm:min-h-[2.40625rem]">
            <div className="line-clamp-2 text-balance text-xs font-semibold leading-snug text-zinc-900 sm:text-sm">
              {titleCard}
            </div>
          </div>
          <p className="line-clamp-3 min-h-[3.35rem] text-[11px] leading-relaxed text-zinc-600 sm:min-h-[3.66rem] sm:text-xs sm:leading-relaxed">
            {p.shortDesc?.trim() ? p.shortDesc : "\u00a0"}
          </p>
        </div>
      </Link>
      <div className="flex shrink-0 flex-col gap-2 rounded-b-2xl border-t border-zinc-900/10 bg-white/60 px-3 pb-3 pt-2 backdrop-blur-[2px]">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-medium tabular-nums sm:text-sm">{p.priceFormatted}</span>
          <button
            type="button"
            onClick={handleAdd}
            className={`shrink-0 rounded-xl px-2.5 py-1 text-[11px] font-semibold text-white sm:text-xs ${
              added ? "bg-emerald-600" : "bg-zinc-900 hover:bg-zinc-800"
            }`}
          >
            {added ? "✓" : "В корзину"}
          </button>
        </div>
        <Link
          href={`/catalog/${p.slug}`}
          className="block text-center text-[11px] font-medium text-zinc-500 hover:text-zinc-900 sm:text-xs"
        >
          Подробнее
        </Link>
      </div>
    </div>
  );
}

export default function HomeFeaturedCarousel({ products }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [needsArrows, setNeedsArrows] = useState(false);
  const [cardWidthPx, setCardWidthPx] = useState<number | null>(null);

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = scrollerRef.current;
      if (!el || cardWidthPx == null) return;
      const left = Math.max(0, Math.min(index * (cardWidthPx + GAP), el.scrollWidth - el.clientWidth));
      el.scrollTo({ left, behavior: "smooth" });
    },
    [cardWidthPx]
  );

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el || products.length === 0) return;

    const measure = () => {
      const W = el.clientWidth;
      if (W <= 0) return;
      const sm = typeof window !== "undefined" && window.innerWidth >= 640;
      const minCard = sm ? MIN_CARD_SM : MIN_CARD;
      const n = products.length;

      if (n <= 1) {
        setNeedsArrows(false);
        setCardWidthPx(null);
        return;
      }

      const totalMin = n * minCard + (n - 1) * GAP;
      if (totalMin <= W + 1) {
        setNeedsArrows(false);
        setCardWidthPx(null);
      } else {
        setNeedsArrows(true);
        const nFit = Math.max(1, Math.floor((W + GAP) / (minCard + GAP)));
        const cardW = (W - (nFit - 1) * GAP) / nFit;
        setCardWidthPx(Math.max(160, cardW));
      }
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [products.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !needsArrows || cardWidthPx == null) return;
    let acc = 0;
    const onWheel = (e: WheelEvent) => {
      if (products.length <= 1) return;
      const dominantY = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
      if (!dominantY) return;
      e.preventDefault();
      acc += e.deltaY;
      const threshold = 40;
      if (Math.abs(acc) < threshold) return;
      const dir = acc > 0 ? 1 : -1;
      acc = 0;
      const step = cardWidthPx + GAP;
      if (step <= 0) return;
      const currentIndex = Math.round(el.scrollLeft / step);
      const nextIndex = Math.max(0, Math.min(products.length - 1, currentIndex + dir));
      scrollToIndex(nextIndex);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [products.length, needsArrows, cardWidthPx, scrollToIndex]);

  const scrollByDir = useCallback(
    (dir: -1 | 1) => {
      const el = scrollerRef.current;
      if (!el || cardWidthPx == null) return;
      const step = cardWidthPx + GAP;
      if (step <= 0) return;
      const currentIndex = Math.round(el.scrollLeft / step);
      const nextIndex = Math.max(0, Math.min(products.length - 1, currentIndex + dir));
      scrollToIndex(nextIndex);
    },
    [products.length, cardWidthPx, scrollToIndex]
  );

  if (products.length === 0) return null;

  const arrowBtn =
    "flex shrink-0 items-center justify-center self-center rounded-lg p-1 text-zinc-800 transition hover:bg-black/[0.06] hover:text-zinc-900 active:bg-black/[0.1] disabled:pointer-events-none disabled:opacity-30";

  const scrollMode = needsArrows && cardWidthPx != null;

  return (
    <section className="mt-16 bg-transparent" aria-label="Наша продукция">
      <h2 className="mb-4 text-center text-xl font-bold tracking-tight sm:text-2xl">Наша продукция</h2>
      <div
        className={
          needsArrows
            ? "grid w-full grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-stretch gap-x-1 sm:grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] sm:gap-x-2"
            : "w-full"
        }
      >
        {needsArrows ? (
          <button type="button" aria-label="Предыдущая позиция" onClick={() => scrollByDir(-1)} className={arrowBtn}>
            <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : null}

        <div
          ref={scrollerRef}
          className={
            needsArrows
              ? "flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              : "flex min-w-0 justify-center gap-3 overflow-x-hidden overflow-y-hidden pb-2"
          }
          style={needsArrows ? { scrollSnapType: "x mandatory" } : undefined}
        >
          {products.map((p) => (
            <FeaturedCard key={p.id} p={p} scrollMode={!!scrollMode} cardWidthPx={cardWidthPx} />
          ))}
        </div>

        {needsArrows ? (
          <button type="button" aria-label="Следующая позиция" onClick={() => scrollByDir(1)} className={arrowBtn}>
            <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : null}
      </div>
    </section>
  );
}
