"use client";

import { useState } from "react";
import type { Promo } from "@prisma/client";

export default function AdminPromosClient({ initialPromos }: { initialPromos: Promo[] }) {
  const [promos, setPromos] = useState(initialPromos);
  const [editing, setEditing] = useState<Promo | null>(null);
  const [form, setForm] = useState({ code: "", percent: 10, description: "", maxUses: "" as number | "", active: true });

  const openEdit = (p: Promo) => {
    setEditing(p);
    setForm({
      code: p.code,
      percent: p.percent,
      description: p.description || "",
      maxUses: p.maxUses ?? "",
      active: p.active,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const res = await fetch(`/api/admin/promos/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        maxUses: form.maxUses === "" ? null : form.maxUses,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPromos((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setEditing(null);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      {promos.map((p) => (
        <div key={p.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 p-4">
          <div>
            <span className="font-mono font-medium">{p.code}</span>
            <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-sm">−{p.percent}%</span>
            {p.description && <p className="mt-1 text-sm text-zinc-600">{p.description}</p>}
            <p className="text-xs text-zinc-500">Использований: {p.usedCount} {p.maxUses != null ? `/ ${p.maxUses}` : ""}</p>
          </div>
          <button type="button" onClick={() => openEdit(p)} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50">
            Редактировать
          </button>
        </div>
      ))}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h3 className="font-semibold">Редактировать промокод</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600">Код</label>
                <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Процент</label>
                <input type="number" value={form.percent} onChange={(e) => setForm((f) => ({ ...f, percent: Number(e.target.value) || 0 }))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Описание</label>
                <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Макс. использований (пусто = без лимита)</label>
                <input type="number" value={form.maxUses} onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value === "" ? "" : Number(e.target.value) }))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
                <span className="text-sm">Активен</span>
              </label>
            </div>
            <div className="mt-6 flex gap-2">
              <button type="button" onClick={saveEdit} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800">Сохранить</button>
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl border px-4 py-2 text-sm hover:bg-zinc-50">Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
