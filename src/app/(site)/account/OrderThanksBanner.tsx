"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { accountCardClass } from "./account-ui";

/** Если в URL есть order + rt (старые ссылки): подсказка про отзыв только после доставки */
export default function OrderThanksBanner() {
  const sp = useSearchParams();
  const order = sp.get("order");
  const rt = sp.get("rt");

  const [canReview, setCanReview] = useState<boolean | null>(null);
  const [hasReview, setHasReview] = useState(false);

  useEffect(() => {
    if (!order || !rt) return;
    let cancelled = false;
    const qs = new URLSearchParams({ orderId: order, token: rt });
    fetch(`/api/reviews/status?${qs}`)
      .then((r) => r.json())
      .then((data: { canReview?: boolean; hasReview?: boolean }) => {
        if (cancelled) return;
        setCanReview(!!data.canReview);
        setHasReview(!!data.hasReview);
      })
      .catch(() => {
        if (!cancelled) setCanReview(false);
      });
    return () => {
      cancelled = true;
    };
  }, [order, rt]);

  if (!order || !rt) return null;

  if (canReview === null) {
    return <div className={`${accountCardClass} mb-8 h-24 animate-pulse`} />;
  }

  if (canReview) {
    const href = `/order/review?order=${encodeURIComponent(order)}&rt=${encodeURIComponent(rt)}`;
    return (
      <div className={`${accountCardClass} mb-8 border-violet-200 bg-violet-50/60 text-center`}>
        <p className="font-medium text-zinc-900">Заказ доставлен</p>
        <p className="mt-2 text-sm text-zinc-700">
          Оставьте отзыв — нам будет очень приятно. После проверки отзыв появится на сайте, а вы получите{" "}
          <strong>промокод −10%</strong> на следующий заказ.
        </p>
        <Link
          href={href}
          className="mt-4 inline-flex rounded-2xl bg-gradient-to-r from-pink-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-95"
        >
          Оставить отзыв
        </Link>
      </div>
    );
  }

  if (hasReview) return null;

  return (
    <div className={`${accountCardClass} mb-8 text-center`}>
      <p className="text-sm text-zinc-700">
        Спасибо за заказ. После доставки по этой ссылке можно будет оставить отзыв и получить промокод. Статус заказа
        смотрите в{" "}
        <Link href="/account/orders" className="font-medium underline">
          истории заказов
        </Link>
        .
      </p>
    </div>
  );
}
