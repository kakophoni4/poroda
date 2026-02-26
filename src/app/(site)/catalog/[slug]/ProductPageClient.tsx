"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/catalog-data";

export default function ProductPageClient({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);

  return (
    <article className="mt-6 grid gap-8 lg:grid-cols-2">
      <div className="grid-lines aspect-square w-full max-w-lg rounded-3xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white" />
      <div>
        <div className="flex flex-wrap gap-2">
          {product.isNew && (
            <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium uppercase text-white">
              new
            </span>
          )}
          {product.oldPrice && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
              скидка
            </span>
          )}
        </div>
        <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">{product.title}</h1>
        {product.shortDesc && <p className="mt-2 text-zinc-600">{product.shortDesc}</p>}
        {product.skinTypes && product.skinTypes.length > 0 && (
          <p className="mt-2 text-sm text-zinc-500">Для кожи: {product.skinTypes.join(", ")}</p>
        )}
        <div className="mt-6 flex items-baseline gap-3">
          <span className="text-2xl font-semibold">{product.price.toLocaleString("ru-RU")} ₽</span>
          {product.oldPrice && (
            <span className="text-lg text-zinc-400 line-through">
              {product.oldPrice.toLocaleString("ru-RU")} ₽
            </span>
          )}
        </div>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <label htmlFor="qty" className="text-sm text-zinc-600">
              Количество
            </label>
            <input
              id="qty"
              type="number"
              min={1}
              max={99}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
              className="w-16 rounded-xl border border-zinc-200 px-3 py-2 text-center text-sm"
            />
          </div>
          <Link
            href={`/checkout?product=${product.id}&qty=${quantity}`}
            className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800"
          >
            В корзину
          </Link>
        </div>
        <p className="mt-6 text-sm text-zinc-500">
          <Link href="/delivery" className="underline hover:text-zinc-700">
            Доставка и оплата
          </Link>
        </p>
      </div>
    </article>
  );
}
