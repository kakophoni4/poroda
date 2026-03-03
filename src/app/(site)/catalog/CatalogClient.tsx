"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  sortOptions,
  sortProducts,
  getProductImages,
  type Product,
  type CatalogCategory,
  type SortOption,
} from "@/lib/catalog-data";

const categoryToFolder: Record<string, number> = { cleansing: 1, toners: 2, serums: 3, creams: 4, masks: 5, sets: 6 };

function ProductCard({ p }: { p: Product }) {
  const images = getProductImages(p, `/images/poroda/${categoryToFolder[p.categorySlug] ?? 1}/1.jpg`);
  const [index, setIndex] = useState(0);
  const current = images[index % images.length] ?? images[0];

  const go = (e: React.MouseEvent, delta: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + delta + images.length) % images.length);
  };

  return (
    <Link
      href={`/catalog/${p.slug}`}
      className="liquidGlass-dock group flex flex-col rounded-3xl overflow-hidden transition-premium border border-white/40"
    >
      <div className="relative aspect-square w-full overflow-hidden">
        {current ? (
          <>
            <Image
              src={current}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
              quality={82}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              style={{ objectPosition: `${p.imageFocusX ?? 50}% ${p.imageFocusY ?? 50}%` }}
              unoptimized={current.startsWith("/uploads/")}
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => go(e, -1)}
                  className="glass absolute left-1 top-1/2 -translate-y-1/2 rounded-full p-1.5 shadow opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Предыдущее фото"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => go(e, 1)}
                  className="glass absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-1.5 shadow opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Следующее фото"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIndex(i); }}
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
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          {p.isNew && (
            <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-medium uppercase text-white">
              new
            </span>
          )}
          {p.oldPrice && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
              скидка
            </span>
          )}
        </div>
        <h2 className="mt-2 text-sm font-semibold text-zinc-900 group-hover:underline line-clamp-2">{p.title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-600 line-clamp-2">{p.shortDesc}</p>
        {p.skinTypes && p.skinTypes.length > 0 && (
          <p className="mt-2 text-[11px] text-zinc-500">Для {p.skinTypes.join(", ")}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold">{p.price.toLocaleString("ru-RU")} ₽</span>
            {p.oldPrice && (
              <span className="text-xs text-zinc-400 line-through">{p.oldPrice.toLocaleString("ru-RU")} ₽</span>
            )}
          </div>
          <span className="text-xs font-medium text-zinc-500 group-hover:text-zinc-900">Подробнее →</span>
        </div>
      </div>
    </Link>
  );
}

type Props = { initialProducts: Product[]; categories: CatalogCategory[] };

export default function CatalogClient({ initialProducts, categories: cats }: Props) {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category") ?? null;
  const sortParam = (searchParams.get("sort") as SortOption) ?? "popular";
  const perPageFromUrl = Math.min(48, Math.max(12, Number(searchParams.get("per_page")) || 12));
  const [perPageLocal, setPerPageLocal] = useState(perPageFromUrl);
  useEffect(() => {
    setPerPageLocal(perPageFromUrl);
  }, [perPageFromUrl]);

  const filtered = useMemo(() => {
    let list = categorySlug
      ? initialProducts.filter((p) => p.categorySlug === categorySlug)
      : [...initialProducts];
    return sortProducts(list, sortParam);
  }, [initialProducts, categorySlug, sortParam]);

  const displayed = useMemo(() => filtered.slice(0, perPageLocal), [filtered, perPageLocal]);

  const sortUrl = (sort: string) => {
    const u = new URLSearchParams(searchParams);
    u.set("sort", sort);
    return `/catalog?${u.toString()}`;
  };
  const perPageUrl = (n: number) => {
    const u = new URLSearchParams(searchParams);
    u.set("per_page", String(n));
    return `/catalog?${u.toString()}`;
  };

  return (
    <div className="mt-8">
      <div className="glass-subtle flex flex-col gap-4 rounded-3xl border border-white/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-zinc-800">Сортировать</span>
          <div className="flex flex-wrap gap-1">
            {sortOptions.map((opt) => (
              <Link
                key={opt.value}
                href={sortUrl(opt.value)}
                className={`rounded-2xl border px-3 py-1.5 text-sm font-medium transition-colors ${
                  sortParam === opt.value
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "glass-subtle border-white/40 text-zinc-800 hover:bg-white/50"
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-800">
          <span>показывать по:</span>
          {[12, 24, 48].map((n) => (
            <Link
              key={n}
              href={perPageUrl(n)}
              className={`rounded-xl border border-white/40 px-2 py-1 text-sm glass-subtle ${perPageLocal === n ? "font-semibold text-zinc-900 ring-1 ring-zinc-900/20" : "text-zinc-700"}`}
            >
              {n}
            </Link>
          ))}
        </div>
      </div>

      {categorySlug && (
        <div className="glass-subtle mt-4 flex flex-wrap gap-2 rounded-2xl border border-white/40 p-3">
          <Link
            href="/catalog"
            className="glass-subtle rounded-2xl border border-white/40 px-3 py-1.5 text-sm font-medium text-zinc-800"
          >
            Все категории
          </Link>
          {cats.map((c) => (
            <Link
              key={c.slug}
              href={`/catalog?category=${c.slug}`}
              className={`rounded-2xl border px-3 py-1.5 text-sm font-medium ${
                c.slug === categorySlug
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "glass-subtle border-white/40 text-zinc-800"
              }`}
            >
              {c.title}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {displayed.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>

      <p className="mt-6 text-sm text-zinc-500">
        показано: 1 – {displayed.length} из {filtered.length} товаров
      </p>
      {filtered.length > perPageLocal && (
        <button
          type="button"
          className="liquidGlass-dock mt-4 inline-flex rounded-2xl border border-white/40 px-5 py-2 text-sm font-medium"
          onClick={() => setPerPageLocal((prev) => Math.min(filtered.length, prev + 12))}
        >
          Показать ещё
        </button>
      )}
    </div>
  );
}
