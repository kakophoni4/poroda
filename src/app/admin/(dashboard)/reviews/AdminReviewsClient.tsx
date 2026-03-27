"use client";

import { useState } from "react";
import type { AdminReviewRow } from "./page";

export default function AdminReviewsClient({ initial }: { initial: AdminReviewRow[] }) {
  const [rows, setRows] = useState<AdminReviewRow[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (id: string, action: "approve" | "reject") => {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: action === "approve" ? "approved" : "rejected",
                rewardCode: data.rewardCode ?? r.rewardCode,
              }
            : r
        )
      );
    } finally {
      setBusy(null);
    }
  };

  if (rows.length === 0) {
    return <p className="mt-6 text-sm text-zinc-500">Пока нет отзывов.</p>;
  }

  return (
    <div className="mt-6 space-y-6">
      {rows.map((r) => (
        <div key={r.id} className="rounded-xl border border-zinc-200 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <span className="font-semibold">{r.authorName}</span>
              <span className="ml-2 text-sm text-amber-600">{"★".repeat(r.rating)}</span>
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                  r.status === "approved"
                    ? "bg-emerald-100 text-emerald-800"
                    : r.status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-900"
                }`}
              >
                {r.status === "pending" ? "на модерации" : r.status === "approved" ? "одобрен" : "отклонён"}
              </span>
            </div>
            <span className="text-xs text-zinc-500">{new Date(r.createdAt).toLocaleString("ru-RU")}</span>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-700">{r.body}</p>
          {r.imageUrls?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {r.imageUrls.map((src) => (
                <a
                  key={src}
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-20 w-20 overflow-hidden rounded-lg border border-zinc-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          ) : null}
          <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600">
            <div>
              Заказ: <span className="font-mono">{r.order.id.slice(0, 12)}…</span>
            </div>
            <div>
              Покупатель в заказе: {r.order.name} · {r.order.email} · {r.order.phone}
            </div>
            <div>Сумма заказа: {r.order.total.toLocaleString("ru-RU")} ₽</div>
          </div>
          {r.rewardCode && (
            <p className="mt-2 text-sm font-mono text-emerald-800">
              Промокод: {r.rewardCode}
            </p>
          )}
          {r.status === "pending" && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy === r.id}
                onClick={() => act(r.id, "approve")}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                Одобрить
              </button>
              <button
                type="button"
                disabled={busy === r.id}
                onClick={() => act(r.id, "reject")}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
              >
                Отклонить
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
