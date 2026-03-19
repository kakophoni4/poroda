"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HomeBannerPublic } from "@/lib/home-promo-banners";

type Props = { banners: HomeBannerPublic[] };

export default function HomePromoBanners({ banners }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const goToSlide = useCallback((next: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const count = banners.length > 0 ? banners.length : 1;
    const n = Math.max(0, Math.min(count - 1, next));
    el.scrollTo({ left: n * w, behavior: "smooth" });
    setIndex(n);
  }, [banners.length]);

  const scrollByDir = useCallback((dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const count = banners.length > 0 ? banners.length : 1;
    const current = Math.round(el.scrollLeft / w);
    const next = Math.max(0, Math.min(count - 1, current + dir));
    goToSlide(next);
  }, [banners.length, goToSlide]);

  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    if (w <= 0) return;
    const count = banners.length > 0 ? banners.length : 1;
    const i = Math.round(el.scrollLeft / w);
    setIndex(Math.min(i, count - 1));
  }, [banners.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let acc = 0;
    const onWheel = (e: WheelEvent) => {
      const count = banners.length > 0 ? banners.length : 1;
      if (count <= 1) return;
      const dominantY = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
      if (!dominantY) return;
      e.preventDefault();
      acc += e.deltaY;
      const threshold = 50;
      if (Math.abs(acc) < threshold) return;
      const dir = acc > 0 ? 1 : -1;
      acc = 0;
      const w = el.clientWidth;
      const current = Math.round(el.scrollLeft / w);
      const next = Math.max(0, Math.min(count - 1, current + dir));
      el.scrollTo({ left: next * w, behavior: "smooth" });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [banners.length]);

  // Автопрокрутка каждые 7 секунд (цикл по кругу)
  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const current = Math.round(el.scrollLeft / w);
      const next = current >= banners.length - 1 ? 0 : current + 1;
      goToSlide(next);
    }, 7000);
    return () => clearInterval(id);
  }, [banners.length, goToSlide]);

  // Если в админке нет активных баннеров — показываем один дефолтный, чтобы блок всегда был виден
  const slides =
    banners.length > 0
      ? banners
      : [
          {
            id: "default-hero",
            imageUrl: "/images/obshchie/hero.jpg",
            linkUrl: "/catalog",
            buttonText: "Вся продукция",
            buttonColor: "#18181b",
          } as HomeBannerPublic,
        ];

  const heightClass =
    "min-h-[200px] h-[28vh] max-h-[320px] sm:min-h-[240px] sm:h-[32vh] sm:max-h-[400px] md:max-h-[460px]";

  return (
    <div
      className="relative left-1/2 z-[5] mb-3 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden shadow-sm sm:mb-4"
      aria-label="Акции и предложения"
    >
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className={`flex snap-x snap-mandatory overflow-x-auto scroll-smooth ${heightClass} [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
        style={{ scrollSnapType: "x mandatory" }}
      >
        {slides.map((b, slideIdx) => (
          <article
            key={b.id}
            className="relative min-w-full shrink-0 snap-center snap-always overflow-hidden"
          >
            <div className={`relative w-full overflow-hidden ${heightClass}`}>
              <img
                src={b.imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover [transform:translateZ(0)]"
                loading={slideIdx === 0 ? "eager" : "lazy"}
                decoding="async"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent"
                aria-hidden
              />
              {b.buttonText.trim() && b.linkUrl.trim() && (
                <div className="absolute inset-x-0 bottom-0 flex justify-center p-4 pb-5 sm:p-6 sm:pb-8">
                  <a
                    href={b.linkUrl.trim()}
                    {...(isExternal(b.linkUrl.trim())
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="inline-flex max-w-[calc(100%-2rem)] items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-95 sm:px-7 sm:py-3 sm:text-base"
                    style={{
                      backgroundColor: b.buttonColor || "#18181b",
                      color: contrastText(b.buttonColor || "#18181b"),
                    }}
                  >
                    {b.buttonText.trim()}
                  </a>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Предыдущий баннер"
            onClick={() => scrollByDir(-1)}
            disabled={index <= 0}
            className="glass absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-zinc-800 opacity-90 shadow-lg transition hover:opacity-100 disabled:pointer-events-none disabled:opacity-25 sm:left-5 sm:h-14 sm:w-14"
          >
            <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Следующий баннер"
            onClick={() => scrollByDir(1)}
            disabled={index >= slides.length - 1}
            className="glass absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-zinc-800 opacity-90 shadow-lg transition hover:opacity-100 disabled:pointer-events-none disabled:opacity-25 sm:right-5 sm:h-14 sm:w-14"
          >
            <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="pointer-events-none absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {slides.map((b, i) => (
              <span
                key={b.id}
                className={`rounded-full transition-all duration-300 ${i === index ? "h-2 w-8 bg-white shadow-sm" : "h-2 w-2 bg-white/60 hover:bg-white/80"}`}
                aria-hidden
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function isExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

function contrastText(hex: string): string {
  const m = hex.replace(/^#/, "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (full.length !== 6) return "#ffffff";
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 160 ? "#18181b" : "#ffffff";
}
