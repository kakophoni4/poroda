"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  sortOptions,
  sortProducts,
  type Product,
  type CatalogCategory,
  type SortOption,
} from "@/lib/catalog-data";

function ProductCard({ p }: { p: Product }) {
  return (
    <Link
      href={`/catalog/${p.slug}`}
      className="group flex flex-col rounded-3xl border border-zinc-200 bg-white overflow-hidden transition-premium hover:shadow-lg hover:border-zinc-300"
    >
      <div className="grid-lines aspect-square w-full bg-gradient-to-b from-zinc-50 to-white" />
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-zinc-600">Сортировать</span>
          <div className="flex flex-wrap gap-1">
            {sortOptions.map((opt) => (
              <Link
                key={opt.value}
                href={sortUrl(opt.value)}
                className={`rounded-2xl border px-3 py-1.5 text-sm transition-colors ${
                  sortParam === opt.value
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <span>показывать по:</span>
          {[12, 24, 48].map((n) => (
            <Link
              key={n}
              href={perPageUrl(n)}
              className={`rounded-lg px-2 py-1 ${perPageLocal === n ? "font-medium text-zinc-900" : "hover:bg-zinc-100"}`}
            >
              {n}
            </Link>
          ))}
        </div>
      </div>

      {categorySlug && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/catalog"
            className="rounded-2xl border border-zinc-200 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
          >
            Все категории
          </Link>
          {cats.map((c) => (
            <Link
              key={c.slug}
              href={`/catalog?category=${c.slug}`}
              className={`rounded-2xl border px-3 py-1.5 text-sm ${
                c.slug === categorySlug
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white hover:bg-zinc-50"
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
          className="mt-4 rounded-2xl border border-zinc-200 bg-white px-5 py-2 text-sm font-medium hover:bg-zinc-50"
          onClick={() => setPerPageLocal((prev) => Math.min(filtered.length, prev + 12))}
        >
          Показать ещё
        </button>
      )}
    </div>
  );
}
