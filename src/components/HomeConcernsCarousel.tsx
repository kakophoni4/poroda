"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { HomeConcernCardPublic } from "@/lib/home-concern-cards-public";
import { concernCardLink } from "@/lib/home-concern-cards-public";

const MD_MIN = "(min-width: 768px)";

function subscribeMdUp(cb: () => void) {
  const mq = window.matchMedia(MD_MIN);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getMdUpSnapshot() {
  return window.matchMedia(MD_MIN).matches;
}

function getMdUpServer() {
  return false;
}

const GAP = 8; // gap-2
const GAP_SM = 12; // sm:gap-3
const MIN_CARD = 70;
const MIN_CARD_SM = 104;

const cardShellClass =
  "group flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/35 bg-transparent";

function ConcernCardInner({ card }: { card: HomeConcernCardPublic }) {
  return (
    <>
      <div className="relative h-16 w-full shrink-0 overflow-hidden rounded-t-2xl bg-transparent sm:h-20">
        <img
          src={card.imageUrl}
          alt=""
          className="h-full w-full object-cover [transform:translateZ(0)] transition-transform duration-200 ease-out will-change-transform group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-start rounded-b-2xl bg-white/60 px-2 py-2 text-center backdrop-blur-[2px] sm:px-2.5 sm:py-2.5">
        <div className="flex min-h-[2.0625rem] w-full flex-col justify-start sm:min-h-[2.234375rem]">
          <p className="line-clamp-2 text-xs font-medium leading-snug text-zinc-900 group-hover:text-zinc-700 sm:text-[13px] sm:leading-snug">
            {card.title}
          </p>
        </div>
      </div>
    </>
  );
}

/** До md: сетка 2 колонки; нечётная последняя — одна карточка по центру */
function ConcernsMobileGrid({ cards }: { cards: HomeConcernCardPublic[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map((card, index) => {
        const lastOdd = index === cards.length - 1 && cards.length % 2 === 1;
        return (
          <Link
            key={card.id}
            href={concernCardLink(card)}
            className={
              lastOdd
                ? `${cardShellClass} col-span-2 mx-auto w-[calc(50%-0.25rem)] max-w-[calc(50%-0.25rem)]`
                : cardShellClass
            }
          >
            <ConcernCardInner card={card} />
          </Link>
        );
      })}
    </div>
  );
}

function HomeConcernsCarouselDesktop({ cards }: { cards: HomeConcernCardPublic[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [needsArrows, setNeedsArrows] = useState(false);
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
        setCardWidthPx(Math.max(64, cardW));
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

  const arrowBtnClass =
    "absolute top-1/2 z-10 flex -translate-y-1/2 items-center justify-center bg-transparent p-1.5 text-zinc-800 transition hover:opacity-80 active:opacity-70 disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className="relative w-full">
      {needsArrows ? (
        <>
          <button
            type="button"
            aria-label="Предыдущая карточка"
            onClick={() => scrollByDir(-1)}
            className={`${arrowBtnClass} left-0 sm:left-0.5`}
          >
            <svg
              className="h-6 w-6 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] sm:h-7 sm:w-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Следующая карточка"
            onClick={() => scrollByDir(1)}
            className={`${arrowBtnClass} right-0 sm:right-0.5`}
          >
            <svg
              className="h-6 w-6 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] sm:h-7 sm:w-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      ) : null}

      <div className={needsArrows ? "min-w-0 px-6 sm:px-7" : "min-w-0"}>
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
                  ? `${cardShellClass} h-full shrink-0 snap-start self-stretch`
                  : `${cardShellClass} h-full flex-1 basis-0 self-stretch`
              }
              style={needsArrows && cardWidthPx != null ? { width: cardWidthPx, flex: "0 0 auto" } : undefined}
            >
              <ConcernCardInner card={card} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

type Props = { cards: HomeConcernCardPublic[]; title?: string };

export default function HomeConcernsCarousel({
  cards,
  title = "С какой проблемой вы столкнулись?",
}: Props) {
  const mdUp = useSyncExternalStore(subscribeMdUp, getMdUpSnapshot, getMdUpServer);

  if (cards.length === 0) return null;

  return (
    <section className="mt-6 bg-transparent sm:mt-8" aria-label={title}>
      <h2 className="mb-3 text-center text-lg font-bold tracking-tight sm:text-xl">{title}</h2>
      {mdUp ? <HomeConcernsCarouselDesktop cards={cards} /> : <ConcernsMobileGrid cards={cards} />}
    </section>
  );
}
