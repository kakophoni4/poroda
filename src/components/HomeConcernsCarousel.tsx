"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import type { HomeConcernCardPublic } from "@/lib/home-concern-cards-public";
import { concernCardLink } from "@/lib/home-concern-cards-public";

const GAP = 8; // gap-2
const GAP_SM = 12; // sm:gap-3
const MIN_CARD = 88;
const MIN_CARD_SM = 104;

type Props = { cards: HomeConcernCardPublic[]; title?: string };

export default function HomeConcernsCarousel({
  cards,
  title = "С какой проблемой вы столкнулись?",
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [needsArrows, setNeedsArrows] = useState(false);
  /** null = все влезают, карточки делят ширину поровну */
  const [cardWidthPx, setCardWidthPx] = useState<number | null>(null);

  const getGap = useCallback(() => {
    if (typeof window === "undefined") return GAP;
    return window.innerWidth >= 640 ? GAP_SM : GAP;
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = scrollerRef.current;
      if (!el || cardWidthPx == null) return;
      const g = getGap();
      const step = cardWidthPx + g;
      const left = Math.max(0, Math.min(index * step, el.scrollWidth - el.clientWidth));
      el.scrollTo({ left, behavior: "smooth" });
    },
    [cardWidthPx, getGap]
  );

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el || cards.length === 0) return;

    const measure = () => {
      const W = el.clientWidth;
      if (W <= 0) return;
      const sm = typeof window !== "undefined" && window.innerWidth >= 640;
      const gap = sm ? GAP_SM : GAP;
      const minCard = sm ? MIN_CARD_SM : MIN_CARD;
      const n = cards.length;

      if (n <= 1) {
        setNeedsArrows(false);
        setCardWidthPx(null);
        return;
      }

      const totalMin = n * minCard + (n - 1) * gap;
      if (totalMin <= W + 1) {
        setNeedsArrows(false);
        setCardWidthPx(null);
      } else {
        setNeedsArrows(true);
        const nFit = Math.max(1, Math.floor((W + gap) / (minCard + gap)));
        const cardW = (W - (nFit - 1) * gap) / nFit;
        setCardWidthPx(Math.max(72, cardW));
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
  }, [cards.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !needsArrows || cardWidthPx == null) return;
    let acc = 0;
    const onWheel = (e: WheelEvent) => {
      if (cards.length <= 1) return;
      const dominantY = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
      if (!dominantY) return;
      e.preventDefault();
      acc += e.deltaY;
      const threshold = 40;
      if (Math.abs(acc) < threshold) return;
      const dir = acc > 0 ? 1 : -1;
      acc = 0;
      const g = getGap();
      const step = cardWidthPx + g;
      if (step <= 0) return;
      const currentIndex = Math.round(el.scrollLeft / step);
      const nextIndex = Math.max(0, Math.min(cards.length - 1, currentIndex + dir));
      scrollToIndex(nextIndex);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [cards.length, needsArrows, cardWidthPx, getGap, scrollToIndex]);

  const scrollByDir = useCallback(
    (dir: -1 | 1) => {
      const el = scrollerRef.current;
      if (!el || cardWidthPx == null) return;
      const g = getGap();
      const step = cardWidthPx + g;
      if (step <= 0) return;
      const currentIndex = Math.round(el.scrollLeft / step);
      const nextIndex = Math.max(0, Math.min(cards.length - 1, currentIndex + dir));
      scrollToIndex(nextIndex);
    },
    [cards.length, cardWidthPx, getGap, scrollToIndex]
  );

  if (cards.length === 0) return null;

  const arrowBtn =
    "flex shrink-0 items-center justify-center self-center rounded-lg p-1 text-zinc-800 transition hover:bg-black/[0.06] hover:text-zinc-900 active:bg-black/[0.1] disabled:pointer-events-none disabled:opacity-30";

  return (
    <section className="mt-6 bg-transparent sm:mt-8" aria-label={title}>
      <h2 className="mb-3 text-center text-lg font-bold tracking-tight sm:text-xl">{title}</h2>
      <div
        className={
          needsArrows
            ? "grid w-full grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-stretch gap-x-1 sm:grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] sm:gap-x-2"
            : "w-full"
        }
      >
        {needsArrows ? (
          <button type="button" aria-label="Предыдущая карточка" onClick={() => scrollByDir(-1)} className={arrowBtn}>
            <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : null}

        <div
          ref={scrollerRef}
          className={
            needsArrows
              ? "flex min-w-0 snap-x snap-mandatory gap-2 overflow-x-auto overflow-y-hidden pb-1 [scrollbar-width:none] sm:gap-3 [&::-webkit-scrollbar]:hidden"
              : "flex min-w-0 justify-center gap-2 overflow-x-hidden overflow-y-hidden pb-1 sm:gap-3"
          }
          style={needsArrows ? { scrollSnapType: "x mandatory" } : undefined}
        >
          {cards.map((card) => (
            <Link
              key={card.id}
              href={concernCardLink(card)}
              className={
                needsArrows && cardWidthPx != null
                  ? "group flex h-full min-h-0 shrink-0 snap-start flex-col self-stretch overflow-hidden rounded-2xl border border-white/35 bg-transparent"
                  : "group flex h-full min-h-0 flex-1 basis-0 flex-col self-stretch overflow-hidden rounded-2xl border border-white/35 bg-transparent"
              }
              style={needsArrows && cardWidthPx != null ? { width: cardWidthPx, flex: "0 0 auto" } : undefined}
            >
              <div className="relative h-16 w-full shrink-0 overflow-hidden rounded-t-2xl bg-transparent sm:h-20">
                <img
                  src={card.imageUrl}
                  alt=""
                  className="h-full w-full object-cover [transform:translateZ(0)] transition-transform duration-200 ease-out will-change-transform group-hover:scale-[1.02]"
                />
              </div>
              {/* Ровная высота под 2 строки (line-clamp-2): одинаковый блок у всех карточек */}
              <div className="flex min-h-0 flex-1 flex-col justify-start rounded-b-2xl bg-white/60 px-2 py-2 text-center backdrop-blur-[2px] sm:px-2.5 sm:py-2.5">
                <div className="flex min-h-[2.0625rem] w-full flex-col justify-start sm:min-h-[2.234375rem]">
                  <p className="line-clamp-2 text-xs font-medium leading-snug text-zinc-900 group-hover:text-zinc-700 sm:text-[13px] sm:leading-snug">
                    {card.title}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {needsArrows ? (
          <button type="button" aria-label="Следующая карточка" onClick={() => scrollByDir(1)} className={arrowBtn}>
            <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : null}
      </div>
    </section>
  );
}
