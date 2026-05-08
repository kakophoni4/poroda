"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Order, OrderItem } from "@prisma/client";
import { orderStatusLabel, ORDER_STATUS_VALUES } from "@/lib/order-status";

type OrderWithRelations = Order & {
  items: (OrderItem & { product: { slug: string; title: string } | null })[];
  user: { id: string; email: string; name: string | null } | null;
};

type PromoOption = { id: string; code: string; isDermatologist: boolean };

const PAYMENT_METHOD_LABEL: Record<string, string> = { online: "онлайн", on_delivery: "при получении" };
const PAYMENT_STATUS_LABEL: Record<string, string> = {
  unpaid: "не оплачен",
  pending: "в обработке",
  paid: "оплачен",
  failed: "ошибка",
  refunded: "возврат",
};

function formatPaymentCell(o: OrderWithRelations) {
  const method = PAYMENT_METHOD_LABEL[o.paymentMethod] ?? o.paymentMethod;
  const pStatus = PAYMENT_STATUS_LABEL[o.paymentStatus] ?? o.paymentStatus;
  const at = o.paymentCheckedAt
    ? new Date(o.paymentCheckedAt).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })
    : "—";
  return { method, pStatus, at };
}

export default function AdminOrdersClient({
  initialOrders,
  promoOptions,
  pagination,
  promoFromUrl,
}: {
  initialOrders: OrderWithRelations[];
  promoOptions: PromoOption[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  promoFromUrl: string;
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [editing, setEditing] = useState<OrderWithRelations | null>(null);
  const [editForm, setEditForm] = useState({ status: "", address: "", phone: "", name: "", email: "" });
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

  const listQuery = (page: number) => {
    const s = new URLSearchParams();
    s.set("page", String(page));
    s.set("limit", String(pagination.limit));
    if (promoFromUrl) s.set("promo", promoFromUrl);
    return s.toString();
  };

  const refetchOrders = async () => {
    const res = await fetch(`/api/admin/orders?${listQuery(pagination.page)}`);
    if (res.ok) {
      const body = (await res.json()) as { data: OrderWithRelations[] };
      setOrders(body.data);
    }
  };

  const markPaid = async (orderId: string) => {
    setMarkingPaidId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "paid" }),
      });
      if (res.ok) {
        await refetchOrders();
      }
    } finally {
      setMarkingPaidId(null);
    }
  };

  const openEdit = (o: OrderWithRelations) => {
    setEditing(o);
    setEditForm({
      status: o.status,
      address: o.address,
      phone: o.phone,
      name: o.name,
      email: o.email,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const res = await fetch(`/api/admin/orders/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setEditing(null);
    }
  };

  const { page, limit, total, totalPages } = pagination;

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <span className="shrink-0">Промокод:</span>
            <select
              value={promoFromUrl}
              onChange={(e) => {
                const s = new URLSearchParams();
                s.set("page", "1");
                s.set("limit", String(limit));
                if (e.target.value) s.set("promo", e.target.value);
                router.push(`/admin/orders?${s.toString()}`);
              }}
              className="min-w-[12rem] rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            >
              <option value="">Все заказы</option>
              <option value="__none__">Без промокода</option>
              {promoOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code}
                  {p.isDermatologist ? " (дерматолог)" : ""}
                </option>
              ))}
            </select>
          </label>
          <span className="text-sm text-zinc-500">
            На этой странице: {orders.length} {total > 0 ? `· всего по фильтру: ${total}` : ""}
            {totalPages > 1 && (
              <>
                {" "}
                · стр. {page} / {totalPages} (по {limit})
              </>
            )}
          </span>
        </div>
        {totalPages > 1 && (
          <div className="flex flex-wrap gap-2">
            {page > 1 && (
              <Link
                href={`/admin/orders?${listQuery(page - 1)}`}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50"
              >
                Назад
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/orders?${listQuery(page + 1)}`}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50"
              >
                Вперёд
              </Link>
            )}
          </div>
        )}
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-600">
              <th className="pb-3 pr-4">ID / Дата</th>
              <th className="pb-3 pr-4">Клиент / Email</th>
              <th className="pb-3 pr-4">Промокод</th>
              <th className="pb-3 pr-4">Сумма</th>
              <th className="pb-3 pr-4">Статус</th>
              <th className="pb-3 pr-4 min-w-[14rem]">Оплата</th>
              <th className="pb-3">Действия</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-zinc-100">
                <td className="py-3 pr-4">
                  <span className="font-mono">{o.id.slice(0, 8)}…</span>
                  <br />
                  <span className="text-zinc-500">{new Date(o.createdAt).toLocaleDateString("ru-RU")}</span>
                </td>
                <td className="py-3 pr-4">
                  {o.name}
                  <br />
                  <span className="text-zinc-600">{o.email}</span>
                </td>
                <td className="py-3 pr-4">{o.promoCode || "—"}</td>
                <td className="py-3 pr-4 font-medium">{o.total.toLocaleString("ru-RU")} ₽</td>
                <td className="py-3 pr-4">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5">{orderStatusLabel(o.status)}</span>
                </td>
                <td className="py-3 pr-4 align-top text-zinc-700">
                  {(() => {
                    const p = formatPaymentCell(o);
                    return (
                      <div className="space-y-0.5 text-xs leading-snug">
                        <div>
                          <span className="text-zinc-500">способ: </span>
                          {p.method}
                        </div>
                        <div>
                          <span className="text-zinc-500">статус: </span>
                          {p.pStatus}
                        </div>
                        <div>
                          <span className="text-zinc-500">проверка: </span>
                          {p.at}
                        </div>
                        {o.paymentMethod === "on_delivery" && o.paymentStatus !== "paid" && (
                          <div className="pt-1">
                            <button
                              type="button"
                              disabled={markingPaidId === o.id}
                              onClick={() => markPaid(o.id)}
                              className="text-left text-amber-800 hover:underline disabled:opacity-50"
                            >
                              {markingPaidId === o.id ? "…" : "Отметить оплаченным"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </td>
                <td className="py-3">
                  <button type="button" onClick={() => openEdit(o)} className="text-zinc-600 hover:underline">
                    Редактировать
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
            <h3 className="font-semibold">Редактирование заказа</h3>
            <p className="mt-1 text-xs text-zinc-500 font-mono">{editing.id}</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600">Статус</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                >
                  {ORDER_STATUS_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {orderStatusLabel(v)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Имя</label>
                <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Email</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Телефон</label>
                <input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Адрес</label>
                <textarea value={editForm.address} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} rows={2} className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="mt-4 text-xs text-zinc-500">
              Продукция: {editing.items.map((i) => `${i.title} × ${i.quantity}`).join(", ")}
            </div>
            <div className="mt-6 flex gap-2">
              <button type="button" onClick={saveEdit} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800">Сохранить</button>
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50">Отмена</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
