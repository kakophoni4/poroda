"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getProductImages, type Product } from "@/lib/catalog-data";
import { useCart } from "@/context/CartContext";
import { useSiteCopy } from "@/context/SiteCopyContext";
import DermatologistVideoModal from "@/components/DermatologistVideoModal";

const categoryToFolder: Record<string, number> = { cleansing: 1, toners: 2, serums: 3, creams: 4, masks: 5, sets: 6 };

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="border-b border-zinc-200/80 pb-2 text-base font-semibold tracking-tight text-zinc-900 sm:text-lg sm:pb-2 md:text-xl">
      {children}
    </h2>
  );
}

export default function ProductPageClient({ product }: { product: Product }) {
  const t = useSiteCopy();
  const router = useRouter();
  const { lines, addProduct, setQuantity, removeProduct, hydrated } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const [qtyRowVisible, setQtyRowVisible] = useState(false);

  const images = useMemo(
    () => getProductImages(product, `/images/poroda/${categoryToFolder[product.categorySlug] ?? 1}/1.jpg`),
    [product]
  );
  const videoUrl = (product.dermatologistVideoUrl || "").trim();
  const hasVideo = Boolean(videoUrl);
  const photoCount = images.length;
  const videoIndex = photoCount;
  const totalThumbs = photoCount + (hasVideo ? 1 : 0);
  const videoPosterSrc = images[photoCount - 1] ?? images[0] ?? "";

  const [mainIndex, setMainIndex] = useState(0);
  /** true = от lg (1024px): до этого показываем только 2 миниатюры в ряд (CSS + порог для стрелок). */
  const [isLgUp, setIsLgUp] = useState(false);
  const mainSrc = images[mainIndex] ?? images[0];
  const [displayedMainSrc, setDisplayedMainSrc] = useState(mainSrc);
  const [mainImgOpacity, setMainImgOpacity] = useState(1);
  const mainImgFadeSkipRef = useRef(true);
  const displayedMainSrcRef = useRef(mainSrc);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const line = lines.find((l) => l.productId === product.id);

  const isVideoSlide = hasVideo && mainIndex === videoIndex;
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [dermaPromptVisible, setDermaPromptVisible] = useState(false);
  const dermaPromptKey = useMemo(() => `poroda_derma_prompt_${product.id}`, [product.id]);

  useEffect(() => {
    if (!hasVideo) {
      setDermaPromptVisible(false);
      return;
    }
    try {
      if (sessionStorage.getItem(dermaPromptKey) === "1") return;
    } catch {
      /* ignore */
    }
    setDermaPromptVisible(true);
  }, [hasVideo, dermaPromptKey]);

  const dismissDermaPrompt = useCallback(() => {
    try {
      sessionStorage.setItem(dermaPromptKey, "1");
    } catch {
      /* ignore */
    }
    setDermaPromptVisible(false);
  }, [dermaPromptKey]);

  const openDermaVideoModal = useCallback(() => {
    try {
      sessionStorage.setItem(dermaPromptKey, "1");
    } catch {
      /* ignore */
    }
    setDermaPromptVisible(false);
    setVideoModalOpen(true);
  }, [dermaPromptKey]);

  useLayoutEffect(() => {
    setMainIndex(0);
    mainImgFadeSkipRef.current = true;
    const first = images[0];
    if (first) {
      displayedMainSrcRef.current = first;
      setDisplayedMainSrc(first);
      setMainImgOpacity(1);
    }
    // Сброс только при смене товара; images соответствует текущему product из замыкания
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  useEffect(() => {
    if (hydrated && line) setQtyRowVisible(true);
  }, [hydrated, line?.productId, line?.quantity]);

  useEffect(() => {
    if (photoCount < 1) return;
    if (!hasVideo && photoCount <= 1) return;

    const id = window.setInterval(() => {
      setMainIndex((i) => {
        if (!hasVideo) {
          if (photoCount <= 1) return 0;
          return (i + 1) % photoCount;
        }
        if (i === videoIndex) return i;
        if (i < photoCount - 1) return i + 1;
        return 0;
      });
    }, 10000);
    return () => window.clearInterval(id);
  }, [photoCount, hasVideo, videoIndex]);

  /** Плавная смена главного фото (клик / автопрокрутка); слайд с видео без кроссфейда картинок */
  useEffect(() => {
    if (isVideoSlide) {
      mainImgFadeSkipRef.current = true;
      return;
    }
    const next = images[mainIndex] ?? images[0];
    if (mainImgFadeSkipRef.current) {
      mainImgFadeSkipRef.current = false;
      displayedMainSrcRef.current = next;
      setDisplayedMainSrc(next);
      setMainImgOpacity(1);
      return;
    }
    if (next === displayedMainSrcRef.current) return;
    setMainImgOpacity(0);
    const t = window.setTimeout(() => {
      displayedMainSrcRef.current = next;
      setDisplayedMainSrc(next);
      requestAnimationFrame(() => setMainImgOpacity(1));
    }, 220);
    return () => window.clearTimeout(t);
  }, [mainIndex, images, isVideoSlide]);

  const scrollThumbs = useCallback((dir: -1 | 1) => {
    const el = thumbsRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsLgUp(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const maxThumbsPerRow = isLgUp ? 4 : 2;
  const visibleThumbCols = Math.min(totalThumbs, maxThumbsPerRow);
  /** Все миниатюры помещаются в один ряд — grid без скролла, иначе не вылезает «кусок» соседней */
  const thumbsNeedScroll = totalThumbs > maxThumbsPerRow;

  useEffect(() => {
    fetch("/api/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: `/catalog/${product.slug}`, productId: product.id }),
    }).catch(() => {});
  }, [product.id, product.slug]);

  const [favorited, setFavorited] = useState(false);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((data: { productIds?: string[] }) => {
        setFavorited(Array.isArray(data.productIds) && data.productIds.includes(product.id));
        setFavoritesLoaded(true);
      })
      .catch(() => setFavoritesLoaded(true));
  }, [product.id]);

  const toggleFavorite = async () => {
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setFavorited(!!data.favorited);
    }
  };

  const hasRich =
    product.problemText ||
    product.careStageText ||
    product.skinTypesLine ||
    (product.researchLinks && product.researchLinks.length) ||
    product.forWhatText ||
    (product.howItWorksLines && product.howItWorksLines.length) ||
    product.howToUseText ||
    product.inciText ||
    product.volumeText ||
    product.shelfLifeText ||
    product.countryText;

  const inStock = product.inStock !== false;
  const scientistsTitle = product.scientistsTitle?.trim() || "Что говорят ученые?";

  const marketplaceLinks = useMemo(() => {
    const out: { href: string; label: string; abbr: string }[] = [];
    if (product.linkWildberries?.trim())
      out.push({ href: product.linkWildberries.trim(), label: "Wildberries", abbr: "WB" });
    if (product.linkOzon?.trim()) out.push({ href: product.linkOzon.trim(), label: "Ozon", abbr: "Ozon" });
    if (product.linkYandexMarket?.trim())
      out.push({ href: product.linkYandexMarket.trim(), label: "Яндекс Маркет", abbr: "Я.Маркет" });
    return out;
  }, [product.linkWildberries, product.linkOzon, product.linkYandexMarket]);

  const marketplaceRow =
    marketplaceLinks.length > 0 ? (
      <div className="flex w-full flex-wrap gap-1.5 min-[340px]:gap-2">
        {marketplaceLinks.map(({ href, label, abbr }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-subtle flex min-h-[40px] min-w-0 flex-1 basis-[calc(50%-0.1875rem)] items-center justify-center rounded-xl border border-white/45 px-1.5 text-center text-[10px] font-semibold leading-tight text-zinc-800 shadow-sm transition-[transform,background-color] duration-300 ease-out hover:bg-white/50 active:scale-[0.98] min-[340px]:basis-auto min-[340px]:px-3 min-[340px]:text-xs sm:min-h-[44px] sm:rounded-2xl sm:text-sm"
          >
            <span className="max-[339px]:hidden">Купить на {label}</span>
            <span className="min-[340px]:hidden">{abbr}</span>
          </a>
        ))}
      </div>
    ) : null;

  const handleAddToCart = () => {
    if (!inStock) return;
    if (line) {
      setQuantity(product.id, Math.min(99, line.quantity + 1));
    } else {
      addProduct({ id: product.id, slug: product.slug, title: product.title, price: product.price }, 1);
    }
    setQtyRowVisible(true);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2200);
  };

  const handleDecQty = () => {
    if (!line) return;
    if (line.quantity <= 1) {
      removeProduct(product.id);
      setQtyRowVisible(false);
    } else {
      setQuantity(product.id, line.quantity - 1);
    }
  };

  const handleIncQty = () => {
    if (!line) return;
    setQuantity(product.id, Math.min(99, line.quantity + 1));
  };

  /** В чекаут с текущей корзиной + этот товар (если ещё не был добавлен) */
  const handleBuy = () => {
    if (!inStock) return;
    if (!line) {
      addProduct({ id: product.id, slug: product.slug, title: product.title, price: product.price }, 1);
    }
    router.push("/checkout");
  };

  const qtyStepper = line && qtyRowVisible && (
    <div className="glass-subtle flex h-[3rem] min-h-[48px] w-full min-w-0 items-center justify-center gap-0.5 rounded-2xl border border-white/45 px-1 shadow-sm transition-shadow duration-300 ease-out sm:min-w-[9.5rem] sm:max-w-[11rem]">
      <button
        type="button"
        className="flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-xl font-medium text-zinc-800 transition-[background-color,transform] duration-300 ease-out active:scale-95 active:bg-white/50 hover:bg-white/45 sm:h-9 sm:min-h-0 sm:min-w-0 sm:w-9"
        aria-label="Меньше"
        onClick={handleDecQty}
      >
        −
      </button>
      <span className="min-w-[2rem] flex-1 text-center text-base font-semibold tabular-nums text-zinc-900 sm:min-w-[1.75rem] sm:flex-none sm:text-sm">
        {line.quantity}
      </span>
      <button
        type="button"
        className="flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-xl font-medium text-zinc-800 transition-[background-color,transform,opacity] duration-300 ease-out active:scale-95 active:bg-white/50 hover:bg-white/45 disabled:opacity-40 sm:h-9 sm:min-h-0 sm:min-w-0 sm:w-9"
        aria-label="Больше"
        disabled={line.quantity >= 99}
        onClick={handleIncQty}
      >
        +
      </button>
    </div>
  );

  return (
    <article className="mt-3 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] sm:mt-6 sm:pb-20">
      {/*
        Всегда две колонки: слева фото + миниатюры + кнопки, справа текст (как на ПК).
        На узком экране левая колонка ~40%, правая ~60%.
      */}
      <div className="grid grid-cols-[minmax(0,40%)_minmax(0,1fr)] items-start gap-2 min-[400px]:gap-3 sm:grid-cols-[minmax(0,42%)_minmax(0,1fr)] sm:gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,440px)] lg:gap-10">
        {/* Левая колонка: галерея + кнопки */}
        <div className="flex min-w-0 flex-col gap-1.5 sm:gap-2 lg:sticky lg:top-20 lg:max-w-xl lg:self-start xl:top-24">
          <div className="liquidGlass-dock relative aspect-square w-full overflow-hidden rounded-xl border border-white/40 shadow-sm sm:rounded-2xl lg:rounded-3xl">
            {isVideoSlide ? (
              <button
                type="button"
                onClick={openDermaVideoModal}
                className="relative block h-full w-full text-left outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-zinc-900"
                aria-label={t("derma.open_aria")}
              >
                {videoPosterSrc ? (
                  <Image
                    src={videoPosterSrc}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 42vw, (max-width: 1280px) 40vw, 520px"
                    quality={85}
                    className="object-cover [transform:translateZ(0)]"
                    style={{
                      objectPosition: `${product.imageFocusX ?? 50}% ${product.imageFocusY ?? 50}%`,
                    }}
                    priority
                    unoptimized={videoPosterSrc.startsWith("/uploads/")}
                  />
                ) : (
                  <div className="grid-lines h-full w-full bg-zinc-200/40" />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-t from-black/60 via-black/35 to-black/25">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-zinc-900 shadow-lg ring-2 ring-white/80 sm:h-16 sm:w-16">
                    <svg className="ml-1 h-7 w-7 sm:h-8 sm:w-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                  <span className="max-w-[90%] px-2 text-center text-[10px] font-semibold uppercase tracking-wide text-white drop-shadow sm:text-xs">
                    {t("derma.slide_label")}
                  </span>
                </div>
              </button>
            ) : displayedMainSrc ? (
              <Image
                src={displayedMainSrc}
                alt=""
                fill
                sizes="(max-width: 1024px) 42vw, (max-width: 1280px) 40vw, 520px"
                quality={85}
                className="object-cover [transform:translateZ(0)] transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] will-change-[opacity]"
                style={{
                  objectPosition: `${product.imageFocusX ?? 50}% ${product.imageFocusY ?? 50}%`,
                  opacity: mainImgOpacity,
                }}
                priority
                unoptimized={displayedMainSrc.startsWith("/uploads/")}
              />
            ) : (
              <div className="grid-lines h-full w-full" />
            )}
            {(product.isNew || product.oldPrice) && (
              <div
                className="pointer-events-none absolute left-0 top-0 z-[5] h-16 w-16 overflow-hidden sm:h-[4.75rem] sm:w-[4.75rem]"
                aria-hidden
              >
                {product.isNew && (
                  <div className="absolute left-[-38%] top-[14%] w-[140%] -rotate-45 border border-white/25 bg-zinc-900 py-0.5 text-center shadow-[0_2px_10px_rgba(0,0,0,0.35)]">
                    <span className="block text-[7px] font-extrabold uppercase tracking-[0.2em] text-white sm:text-[8px] sm:tracking-[0.25em]">
                      new
                    </span>
                  </div>
                )}
                {product.oldPrice && (
                  <div
                    className={`absolute left-[-38%] w-[140%] -rotate-45 border border-white/30 bg-amber-500 py-0.5 text-center shadow-[0_2px_10px_rgba(180,83,9,0.45)] ${
                      product.isNew ? "top-[38%]" : "top-[14%]"
                    }`}
                  >
                    <span className="block text-[7px] font-extrabold uppercase tracking-wide text-white sm:text-[8px]">
                      скидка
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {totalThumbs > 1 && (
            <div className="relative mt-2 w-full min-w-0 sm:mt-3">
              {thumbsNeedScroll && totalThumbs > visibleThumbCols && (
                <button
                  type="button"
                  aria-label="Предыдущие фото"
                  onClick={() => scrollThumbs(-1)}
                  className="absolute left-0 top-1/2 z-10 -translate-y-1/2 p-0 text-zinc-800 transition-colors duration-300 ease-out hover:text-zinc-950"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {thumbsNeedScroll && totalThumbs > visibleThumbCols && (
                <button
                  type="button"
                  aria-label="Следующие фото"
                  onClick={() => scrollThumbs(1)}
                  className="absolute right-0 top-1/2 z-10 -translate-y-1/2 p-0 text-zinc-800 transition-colors duration-300 ease-out hover:text-zinc-950"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              <div
                ref={thumbsNeedScroll ? thumbsRef : undefined}
                onWheel={(e) => {
                  if (!thumbsNeedScroll || totalThumbs <= visibleThumbCols) return;
                  if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
                  e.preventDefault();
                  thumbsRef.current?.scrollBy({ left: e.deltaY, behavior: "smooth" });
                }}
                className={
                  thumbsNeedScroll
                    ? "touch-pan-x flex gap-1 overflow-x-auto overflow-y-hidden scroll-smooth pb-0.5 [scrollbar-width:none] snap-x snap-mandatory [-webkit-overflow-scrolling:touch] sm:gap-2 sm:pb-1 [&::-webkit-scrollbar]:hidden"
                    : "grid w-full grid-cols-2 gap-1 sm:gap-2 lg:grid-cols-4"
                }
              >
                {images.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMainIndex(i)}
                    className={`relative box-border aspect-square min-h-0 overflow-hidden rounded-xl transition-[border-color,transform,box-shadow] duration-300 ease-out will-change-transform active:scale-[0.98] ${
                      thumbsNeedScroll
                        ? "w-[calc((100%-0.25rem)/2)] min-w-[calc((100%-0.25rem)/2)] shrink-0 snap-start sm:w-[calc((100%-0.5rem)/2)] sm:min-w-[calc((100%-0.5rem)/2)] lg:w-[calc((100%-1.5rem)/4)] lg:min-w-[calc((100%-1.5rem)/4)]"
                        : "w-full min-w-0"
                    } ${
                      i === mainIndex
                        ? "border-2 border-zinc-900"
                        : "border-2 border-zinc-300/70 hover:border-zinc-400/90"
                    }`}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="120px"
                      quality={75}
                      className="object-cover [transform:translateZ(0)] transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)]"
                      unoptimized={src.startsWith("/uploads/")}
                    />
                  </button>
                ))}
                {hasVideo && (
                  <button
                    type="button"
                    onClick={() => {
                      setMainIndex(videoIndex);
                      openDermaVideoModal();
                    }}
                    className={`relative box-border aspect-square min-h-0 overflow-hidden rounded-xl transition-[border-color,transform,box-shadow] duration-300 ease-out will-change-transform active:scale-[0.98] ${
                      thumbsNeedScroll
                        ? "w-[calc((100%-0.25rem)/2)] min-w-[calc((100%-0.25rem)/2)] shrink-0 snap-start sm:w-[calc((100%-0.5rem)/2)] sm:min-w-[calc((100%-0.5rem)/2)] lg:w-[calc((100%-1.5rem)/4)] lg:min-w-[calc((100%-1.5rem)/4)]"
                        : "w-full min-w-0"
                    } ${
                      mainIndex === videoIndex
                        ? "border-2 border-zinc-900"
                        : "border-2 border-zinc-300/70 hover:border-zinc-400/90"
                    }`}
                    aria-label={t("derma.open_aria")}
                  >
                    {videoPosterSrc ? (
                      <Image
                        src={videoPosterSrc}
                        alt=""
                        fill
                        sizes="120px"
                        quality={75}
                        className="object-cover [transform:translateZ(0)]"
                        unoptimized={videoPosterSrc.startsWith("/uploads/")}
                      />
                    ) : (
                      <div className="h-full w-full bg-zinc-300/60" />
                    )}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-zinc-900 shadow sm:h-10 sm:w-10">
                        <svg className="ml-0.5 h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    </div>
                    <span className="pointer-events-none absolute bottom-1 left-1 right-1 truncate text-center text-[9px] font-bold uppercase tracking-wide text-white drop-shadow sm:text-[10px]">
                      {t("derma.thumb_label")}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Кнопки под фото — в той же левой колонке */}
          <div className="flex w-full min-w-0 flex-col gap-1.5 sm:gap-2">
            {inStock ? (
              <>
                <div className="grid w-full grid-cols-1 gap-1.5 min-[340px]:grid-cols-2 sm:gap-2">
                  {!qtyRowVisible || !line ? (
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className={`flex min-h-[44px] items-center justify-center rounded-xl px-2 text-[10px] font-semibold leading-tight text-white shadow-md transition-[transform,background-color,color,box-shadow] duration-300 ease-out active:scale-[0.98] min-[340px]:text-[11px] sm:min-h-[48px] sm:rounded-2xl sm:px-3 sm:text-sm ${
                        justAdded ? "bg-emerald-600 hover:bg-emerald-600" : "bg-zinc-900 hover:bg-zinc-800"
                      }`}
                    >
                      <span className="max-[339px]:hidden">{justAdded ? "Добавлено ✓" : "В корзину"}</span>
                      <span className="min-[340px]:hidden">{justAdded ? "✓" : "Корзина"}</span>
                    </button>
                  ) : (
                    <div className="min-w-0">{qtyStepper}</div>
                  )}
                  <button
                    type="button"
                    onClick={handleBuy}
                    className="flex min-h-[44px] items-center justify-center rounded-xl border-2 border-zinc-900 bg-transparent px-2 text-[11px] font-semibold leading-tight text-zinc-900 shadow-sm transition-[transform,background-color,color,border-color] duration-300 ease-out active:scale-[0.98] hover:bg-zinc-900 hover:text-white sm:min-h-[48px] sm:rounded-2xl sm:px-3 sm:text-sm"
                  >
                    Купить
                  </button>
                </div>
                {marketplaceRow}
                {favoritesLoaded && (
                  <button
                    type="button"
                    onClick={toggleFavorite}
                    className="glass-subtle flex min-h-[40px] w-full items-center justify-center rounded-xl border border-white/45 px-2 text-[11px] font-medium shadow-sm transition-[transform,background-color,border-color,opacity] duration-300 ease-out active:scale-[0.98] hover:bg-white/45 sm:min-h-[44px] sm:rounded-2xl sm:px-3 sm:text-sm"
                    title={favorited ? "Убрать из избранного" : "В избранное"}
                  >
                    <span className="sm:hidden">{favorited ? "♥" : "♡"}</span>
                    <span className="hidden sm:inline">{favorited ? "♥ В избранном" : "♡ В избранное"}</span>
                  </button>
                )}
              </>
            ) : (
              <div className="flex w-full flex-col gap-1.5">
                <span className="flex min-h-[44px] cursor-not-allowed items-center justify-center rounded-xl bg-zinc-300 px-2 text-center text-[11px] font-semibold text-zinc-600 sm:min-h-[48px] sm:rounded-2xl sm:text-sm">
                  Нет в наличии
                </span>
                {marketplaceRow}
                {favoritesLoaded && (
                  <button
                    type="button"
                    onClick={toggleFavorite}
                    className="glass-subtle flex min-h-[40px] w-full items-center justify-center rounded-xl border border-white/45 px-2 text-[11px] font-medium sm:min-h-[44px] sm:rounded-2xl sm:text-sm"
                    title={favorited ? "Убрать из избранного" : "В избранное"}
                  >
                    <span className="sm:hidden">{favorited ? "♥" : "♡"}</span>
                    <span className="hidden sm:inline">{favorited ? "♥ В избранном" : "♡ В избранное"}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Правая колонка: текст */}
        <div className="flex min-w-0 flex-col gap-2 sm:gap-3 lg:gap-4">
          <h1 className="text-balance text-xs font-semibold leading-snug tracking-tight text-zinc-900 min-[360px]:text-sm min-[400px]:text-base sm:text-xl md:text-2xl lg:text-[1.75rem] lg:leading-tight">
            {product.title}
          </h1>

          {product.articleCode && (
            <p className="text-xs font-medium text-zinc-500 sm:text-sm">Артикул: {product.articleCode}</p>
          )}

          <div className="flex flex-col gap-1.5 border-b border-zinc-200/60 pb-2 tabular-nums min-[380px]:flex-row min-[380px]:flex-wrap min-[380px]:items-center min-[380px]:gap-x-2 sm:gap-2 sm:pb-4 md:gap-x-4">
            <div className="flex min-w-0 flex-wrap items-baseline gap-1 sm:gap-2">
              {product.oldPrice ? (
                <span className="text-xs font-medium text-zinc-400 line-through sm:text-sm md:text-base lg:text-lg">
                  {product.oldPrice.toLocaleString("ru-RU")} ₽
                </span>
              ) : null}
              <span className="text-base font-semibold text-zinc-900 sm:text-lg md:text-xl lg:text-3xl">
                {product.price.toLocaleString("ru-RU")} ₽
              </span>
            </div>
            <span
              className={`w-fit shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:px-2.5 sm:py-1 sm:text-xs lg:text-sm ${
                inStock ? "bg-emerald-100/90 text-emerald-800" : "bg-red-100/90 text-red-800"
              }`}
            >
              {inStock ? "В наличии" : "Нет в наличии"}
            </span>
          </div>

          {product.shortDesc && (
            <p className="text-[11px] leading-snug text-zinc-700 sm:text-sm sm:leading-relaxed lg:text-[15px]">
              {product.shortDesc}
            </p>
          )}

          {(product.problemText ||
            product.careStageText ||
            product.skinTypesLine ||
            (product.skinTypes && product.skinTypes.length > 0)) && (
            <div className="liquidGlass-dock space-y-2 rounded-lg border border-white/40 p-2 text-[11px] leading-snug text-zinc-700 sm:space-y-3 sm:rounded-2xl sm:p-4 sm:text-sm sm:leading-relaxed">
              {product.problemText && (
                <p>
                  <span className="font-semibold text-zinc-900">Проблема: </span>
                  {product.problemText}
                </p>
              )}
              {product.careStageText && (
                <p>
                  <span className="font-semibold text-zinc-900">Этап ухода: </span>
                  {product.careStageText}
                </p>
              )}
              {(product.skinTypesLine || (product.skinTypes && product.skinTypes.length > 0)) && (
                <p>
                  <span className="font-semibold text-zinc-900">Тип кожи: </span>
                  {product.skinTypesLine || product.skinTypes!.join(", ")}
                </p>
              )}
            </div>
          )}

          <p className="text-xs text-zinc-500 sm:text-sm">
            <Link
              href="/delivery"
              className="inline-block py-1 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-800"
            >
              Доставка и оплата
            </Link>
          </p>
        </div>
      </div>

      {/* Длинный контент на полную ширину контейнера */}
      {hasRich && (
        <div className="mt-8 w-full space-y-8 sm:mt-12 sm:space-y-10 md:mt-14 md:space-y-12">
          {product.researchLinks && product.researchLinks.length > 0 && (
            <section className="space-y-4">
              <SectionTitle>{scientistsTitle}</SectionTitle>
              <ul className="space-y-3 text-sm leading-relaxed text-zinc-700 sm:text-[15px]">
                {product.researchLinks.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" aria-hidden />
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-800 underline decoration-zinc-300 underline-offset-2 transition hover:decoration-zinc-600"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <span>{item.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {product.forWhatText && (
            <section className="space-y-4">
              <SectionTitle>Для чего?</SectionTitle>
              <div className="space-y-4 text-sm leading-relaxed text-zinc-700 sm:text-[15px] sm:leading-[1.65]">
                {product.forWhatText.split(/\n\n+/).map((para, i) => (
                  <p key={i}>{para.trim()}</p>
                ))}
              </div>
            </section>
          )}

          {product.howItWorksLines && product.howItWorksLines.length > 0 && (
            <section className="space-y-4">
              <SectionTitle>Как работает?</SectionTitle>
              <ul className="space-y-4">
                {product.howItWorksLines.map((line, i) => (
                  <li
                    key={i}
                    className="border-l-[3px] border-zinc-900/15 pl-4 text-sm leading-relaxed text-zinc-700 sm:text-[15px] sm:leading-[1.65]"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {product.howToUseText && (
            <section className="space-y-4">
              <SectionTitle>Как использовать?</SectionTitle>
              <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700 sm:text-[15px] sm:leading-[1.65]">
                {product.howToUseText}
              </p>
            </section>
          )}

          {product.inciText && (
            <section className="space-y-4">
              <SectionTitle>Из чего состоит?</SectionTitle>
              <div className="liquidGlass-dock overflow-x-auto rounded-2xl border border-white/40 p-3 sm:p-5">
                <p className="min-w-0 whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-zinc-700 sm:text-xs sm:leading-relaxed md:text-[13px]">
                  {product.inciText}
                </p>
              </div>
            </section>
          )}

          {(product.volumeText || product.shelfLifeText || product.countryText) && (
            <div className="flex flex-wrap gap-x-8 gap-y-2 border-t border-zinc-200/60 pt-8 text-sm text-zinc-600">
              {product.volumeText && (
                <p>
                  <span className="font-medium text-zinc-900">Объём: </span>
                  {product.volumeText}
                </p>
              )}
              {product.shelfLifeText && (
                <p>
                  <span className="font-medium text-zinc-900">Срок годности: </span>
                  {product.shelfLifeText}
                </p>
              )}
              {product.countryText && (
                <p>
                  <span className="font-medium text-zinc-900">Страна производства: </span>
                  {product.countryText}
                </p>
              )}
            </div>
          )}

          {!product.inciText && (product.composition || product.components) && (
            <section className="space-y-4 border-t border-zinc-200/60 pt-8">
              {product.composition && (
                <div>
                  <SectionTitle>Состав</SectionTitle>
                  <p className="mt-3 whitespace-pre-line text-sm text-zinc-700">{product.composition}</p>
                </div>
              )}
              {product.components && (
                <div className="mt-6">
                  <h3 className="text-base font-semibold text-zinc-900">Компоненты</h3>
                  <p className="mt-2 whitespace-pre-line text-sm text-zinc-700">{product.components}</p>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {!hasRich && (product.composition || product.components || product.extraField1 || product.extraField2) && (
        <div className="mt-10 w-full space-y-4 border-t border-white/40 pt-8">
          {product.composition && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Состав</h3>
              <p className="mt-1 whitespace-pre-line text-sm text-zinc-600">{product.composition}</p>
            </div>
          )}
          {product.components && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Компоненты</h3>
              <p className="mt-1 whitespace-pre-line text-sm text-zinc-600">{product.components}</p>
            </div>
          )}
        </div>
      )}

      {hasVideo && videoUrl && (
        <DermatologistVideoModal open={videoModalOpen} videoUrl={videoUrl} onClose={() => setVideoModalOpen(false)} />
      )}

      {hasVideo && dermaPromptVisible && (
        <div
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(0.75rem,env(safe-area-inset-right))] z-[95] w-[min(calc(100vw-1.5rem),18.5rem)] liquidGlass-dock rounded-2xl border border-white/50 p-3 shadow-xl sm:p-4"
          role="dialog"
          aria-label={t("derma.prompt_dialog_aria")}
        >
          <p className="text-xs font-medium leading-snug text-zinc-800 sm:text-sm">{t("derma.prompt_text")}</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={openDermaVideoModal}
              className="min-h-[40px] flex-1 rounded-xl bg-zinc-900 py-2 text-xs font-semibold text-white hover:bg-zinc-800 sm:text-sm"
            >
              {t("derma.prompt_yes")}
            </button>
            <button
              type="button"
              onClick={dismissDermaPrompt}
              className="min-h-[40px] flex-1 rounded-xl border-2 border-zinc-300 py-2 text-xs font-semibold text-zinc-800 hover:bg-white/50 sm:text-sm"
            >
              {t("derma.prompt_no")}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
