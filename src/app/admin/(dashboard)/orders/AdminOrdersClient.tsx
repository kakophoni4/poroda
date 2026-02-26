"use client";

import { useState } from "react";
import type { Order, OrderItem, User, Product } from "@prisma/client";

type OrderWithRelations = Order & {
  items: (OrderItem & { product: { slug: string; title: string } | null })[];
  user: { id: string; email: string; name: string | null } | null;
};

export default function AdminOrdersClient({ initialOrders }: { initialOrders: OrderWithRelations[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [editing, setEditing] = useState<OrderWithRelations | null>(null);
  const [editForm, setEditForm] = useState({ status: "", address: "", phone: "", name: "", email: "" });

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

  return (
    <>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-600">
              <th className="pb-3 pr-4">ID / Дата</th>
              <th className="pb-3 pr-4">Клиент / Email</th>
              <th className="pb-3 pr-4">Промокод</th>
              <th className="pb-3 pr-4">Сумма</th>
              <th className="pb-3 pr-4">Статус</th>
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
                <td className="py-3 pr-4"><span className="rounded-full bg-zinc-100 px-2 py-0.5">{o.status}</span></td>
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
                <input value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
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
              Товары: {editing.items.map((i) => `${i.title} × ${i.quantity}`).join(", ")}
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
