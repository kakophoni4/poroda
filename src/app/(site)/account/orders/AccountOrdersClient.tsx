"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { accountCardClass } from "../account-ui";
import { normalizeOrderStatus, orderStatusLabel } from "@/lib/order-status";

type OrderRow = {
  id: string;
  createdAt: string;
  total: number;
  status: string;
  reviewToken: string | null;
  review: { id: string; status: string } | null;
  items: {
    productId: string;
    title: string;
    quantity: number;
    price: number;
    product: { slug: string } | null;
  }[];
};

export default function AccountOrdersClient() {
  const router = useRouter();
  const { addProduct, hydrated } = useCart();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/orders")
      .then((r) => {
        if (r.status === 401) {
          if (!cancelled) {
            setError("auth");
            setOrders([]);
          }
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (cancelled || data === null) return;
        if (Array.isArray(data)) {
          setOrders(data as OrderRow[]);
        } else {
          setError("load");
          setOrders([]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("load");
          setOrders([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const repeatOrder = (o: OrderRow) => {
    if (!hydrated) return;
    const withSlug = o.items.filter((it) => it.product?.slug);
    const skipped = o.items.length - withSlug.length;
    if (withSlug.length === 0) {
      alert("Товары из этого заказа сейчас недоступны в каталоге.");
      return;
    }
    for (const it of withSlug) {
      addProduct(
        {
          id: it.productId,
          slug: it.product!.slug,
          title: it.title,
          price: it.price,
        },
        it.quantity
      );
    }
    if (skipped > 0) {
      alert(`В корзину добавлено ${withSlug.length} поз. ${skipped} поз. пропущено — товар снят с сайта.`);
    }
    router.push("/checkout");
  };

  if (orders === null) {
    return (
      <>
        <h1 className="text-2xl font-semibold">История заказов</h1>
        <div className={`${accountCardClass} mt-6 h-40 animate-pulse`} />
      </>
    );
  }

  if (error === "auth") {
    return (
      <>
        <h1 className="text-2xl font-semibold">История заказов</h1>
        <p className="mt-4 text-sm text-zinc-600">
          <Link href="/login?from=/account/orders" className="font-medium underline">
            Войдите
          </Link>
          , чтобы видеть заказы.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">История заказов</h1>
      <div className="mt-6 space-y-4">
        {orders.length === 0 ? (
          <div className={accountCardClass}>
            <p className="text-sm text-zinc-600">
              Пока нет заказов.{" "}
              <Link href="/catalog" className="font-medium text-zinc-900 underline hover:no-underline">
                Перейти к продукции
              </Link>
            </p>
          </div>
        ) : (
          orders.map((o) => {
            const norm = normalizeOrderStatus(o.status);
            const canReview = norm === "delivered" && !o.review;
            const reviewHref =
              o.reviewToken != null && o.reviewToken !== ""
                ? `/order/review?order=${encodeURIComponent(o.id)}&rt=${encodeURIComponent(o.reviewToken)}`
                : `/order/review?order=${encodeURIComponent(o.id)}`;
            return (
              <div key={o.id} className={accountCardClass}>
                <p className="break-all font-mono text-xs leading-relaxed text-zinc-800 sm:text-sm">{o.id}</p>
                <p className="mt-2 text-sm text-zinc-500">
                  {new Date(o.createdAt).toLocaleString("ru-RU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="mt-3 text-lg font-semibold tabular-nums">{o.total.toLocaleString("ru-RU")} ₽</p>
                <p className="mt-2">
                  <span className="inline-block rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-800">
                    {orderStatusLabel(o.status)}
                  </span>
                </p>
                <ul className="mt-4 space-y-1 text-sm text-zinc-600">
                  {o.items.map((it, i) => (
                    <li key={i}>
                      {it.title} × {it.quantity} — {(it.price * it.quantity).toLocaleString("ru-RU")} ₽
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={!hydrated}
                  onClick={() => repeatOrder(o)}
                  className="mx-auto mt-4 block rounded-2xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
                >
                  Повторить заказ
                </button>
                {canReview ? (
                  <Link
                    href={reviewHref}
                    className="mx-auto mt-3 block rounded-2xl bg-gradient-to-r from-pink-600 to-violet-600 px-4 py-2 text-center text-sm font-medium text-white shadow-sm hover:opacity-95"
                  >
                    Оставить отзыв — нам будет очень приятно
                  </Link>
                ) : o.review?.status === "pending" ? (
                  <p className="mt-4 text-sm text-amber-800">Отзыв на модерации.</p>
                ) : o.review?.status === "approved" ? (
                  <p className="mt-4 text-sm text-emerald-800">Спасибо за отзыв! Он опубликован.</p>
                ) : o.review?.status === "rejected" ? (
                  <p className="mt-4 text-sm text-zinc-600">Отзыв не прошёл модерацию.</p>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
