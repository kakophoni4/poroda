"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { getProductImages, type Product } from "@/lib/catalog-data";

const categoryToFolder: Record<string, number> = { cleansing: 1, toners: 2, serums: 3, creams: 4, masks: 5, sets: 6 };

export default function ProductPageClient({ product }: { product: Product }) {
  const images = getProductImages(product, `/images/poroda/${categoryToFolder[product.categorySlug] ?? 1}/1.jpg`);
  const [mainIndex, setMainIndex] = useState(0);
  const mainSrc = images[mainIndex] ?? images[0];

  useEffect(() => {
    fetch("/api/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: `/catalog/${product.slug}`, productId: product.id }),
    }).catch(() => {});
  }, [product.id, product.slug]);
  const [quantity, setQuantity] = useState(1);
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

  return (
    <article className="mt-6 grid gap-8 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="glass-card relative aspect-square w-full max-w-lg overflow-hidden rounded-3xl border-white/50">
          {mainSrc ? (
            <Image
              src={mainSrc}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 800px"
              quality={85}
              className="object-cover"
              style={{ objectPosition: `${product.imageFocusX ?? 50}% ${product.imageFocusY ?? 50}%` }}
              priority
              unoptimized={mainSrc.startsWith("/uploads/")}
            />
          ) : (
            <div className="grid-lines h-full w-full" />
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setMainIndex(i)}
                className={`glass-card relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${i === mainIndex ? "border-zinc-900" : "border-white/50"}`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="80px"
                  quality={75}
                  className="object-cover"
                  unoptimized={src.startsWith("/uploads/")}
                />
              </button>
            ))}
          </div>
        )}
      </div>
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
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3">
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
              className="glass-input w-16 rounded-xl px-3 py-2 text-center text-sm"
            />
          </div>
          <Link
            href={`/checkout?product=${product.id}&qty=${quantity}`}
            className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800"
          >
            В корзину
          </Link>
          {favoritesLoaded && (
            <button
              type="button"
              onClick={toggleFavorite}
              className="liquid-glass glass-btn inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium"
              title={favorited ? "Убрать из избранного" : "В избранное"}
            >
              {favorited ? "♥ В избранном" : "♡ В избранное"}
            </button>
          )}
        </div>

        {(product.composition || product.components || product.extraField1 || product.extraField2) && (
          <div className="mt-8 space-y-4 border-t border-white/40 pt-6">
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
            {product.extraField1 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Дополнительно</h3>
                <p className="mt-1 text-sm text-zinc-600">{product.extraField1}</p>
              </div>
            )}
            {product.extraField2 && (
              <div>
                <p className="text-sm text-zinc-600">{product.extraField2}</p>
              </div>
            )}
          </div>
        )}

        <p className="mt-6 text-sm text-zinc-500">
          <Link href="/delivery" className="underline hover:text-zinc-700">
            Доставка и оплата
          </Link>
        </p>
      </div>
    </article>
  );
}
