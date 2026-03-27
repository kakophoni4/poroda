"use client";

import { useState } from "react";
import type { Promo } from "@prisma/client";

export type PromoOrderStats = { orderCount: number; totalSum: number };

const emptyForm = () => ({
  code: "",
  percent: 10,
  description: "",
  maxUses: "" as number | "",
  active: true,
  isDermatologist: false,
  dermatologistRewardPercent: 10,
});

function formatDiscount(p: Promo): string {
  const rub = p.discountRub ?? 0;
  if (rub > 0) return `−${rub.toLocaleString("ru-RU")} ₽`;
  return `−${p.percent}%`;
}

function rewardRub(stats: PromoOrderStats | undefined, percent: number | null | undefined): number {
  if (!stats || percent == null) return 0;
  return Math.round((stats.totalSum * percent) / 100);
}

type Props = {
  initialPromos: Promo[];
  orderStatsByPromoId: Record<string, PromoOrderStats>;
};

export default function AdminPromosClient({ initialPromos, orderStatsByPromoId }: Props) {
  const [promos, setPromos] = useState(initialPromos);
  const [editing, setEditing] = useState<Promo | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const openEdit = (p: Promo) => {
    setEditing(p);
    setCreating(false);
    setForm({
      code: p.code,
      percent: p.percent,
      description: p.description || "",
      maxUses: p.maxUses ?? "",
      active: p.active,
      isDermatologist: p.isDermatologist,
      dermatologistRewardPercent: p.dermatologistRewardPercent ?? 10,
    });
  };

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm(emptyForm());
  };

  const payloadBody = () => ({
    ...form,
    maxUses: form.maxUses === "" ? null : form.maxUses,
    dermatologistRewardPercent: form.isDermatologist ? form.dermatologistRewardPercent : null,
  });

  const saveEdit = async () => {
    if (!editing) return;
    const res = await fetch(`/api/admin/promos/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadBody()),
    });
    if (res.ok) {
      const updated = await res.json();
      setPromos((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setEditing(null);
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Ошибка сохранения");
    }
  };

  const saveCreate = async () => {
    if (!form.code?.trim()) return;
    const res = await fetch("/api/admin/promos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadBody()),
    });
    if (res.ok) {
      const created = await res.json();
      setPromos((prev) => [created, ...prev]);
      setCreating(false);
      setForm(emptyForm());
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Ошибка создания");
    }
  };

  const formFields = (
    <>
      <div>
        <label className="block text-xs font-medium text-zinc-600">Код</label>
        <input
          value={form.code}
          onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="DERM2025"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-600">Скидка для покупателя, %</label>
        <input
          type="number"
          min={0}
          max={100}
          value={form.percent}
          onChange={(e) => setForm((f) => ({ ...f, percent: Number(e.target.value) || 0 }))}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-600">Описание (внутреннее)</label>
        <input
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-600">Макс. использований (пусто = без лимита)</label>
        <input
          type="number"
          value={form.maxUses}
          onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value === "" ? "" : Number(e.target.value) }))}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.isDermatologist}
          onChange={(e) => setForm((f) => ({ ...f, isDermatologist: e.target.checked }))}
        />
        <span className="text-sm">Промокод дерматолога (учёт заказов и вознаграждение)</span>
      </label>
      {form.isDermatologist && (
        <div>
          <label className="block text-xs font-medium text-zinc-600">
            Вознаграждение дерматологу, % от суммы заказов (поле «Итого»)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={form.dermatologistRewardPercent}
            onChange={(e) =>
              setForm((f) => ({ ...f, dermatologistRewardPercent: Number(e.target.value) || 0 }))
            }
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
      )}
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
        <span className="text-sm">Активен</span>
      </label>
    </>
  );

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          + Добавить скидку / промокод
        </button>
      </div>
      {promos.map((p) => {
        const stats = orderStatsByPromoId[p.id];
        const reward = rewardRub(stats, p.dermatologistRewardPercent);
        return (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-medium">{p.code}</span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-sm">{formatDiscount(p)}</span>
                {p.isDermatologist && (
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-900">
                    Дерматолог · {p.dermatologistRewardPercent ?? 0}% к выплате
                  </span>
                )}
              </div>
              {p.description && <p className="mt-1 text-sm text-zinc-600">{p.description}</p>}
              <p className="text-xs text-zinc-500">
                Срабатываний по лимиту промо: {p.usedCount} {p.maxUses != null ? `/ ${p.maxUses}` : ""}
              </p>
              {stats && (
                <p className="mt-2 text-sm text-zinc-700">
                  <span className="font-medium">Заказы с этим кодом:</span> {stats.orderCount} шт., на сумму{" "}
                  {stats.totalSum.toLocaleString("ru-RU")} ₽
                  {p.isDermatologist && (
                    <>
                      {" "}
                      → <span className="font-medium">вознаграждение</span> ~{reward.toLocaleString("ru-RU")} ₽
                    </>
                  )}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => openEdit(p)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50"
              >
                Редактировать
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm("Удалить промокод?")) return;
                  const res = await fetch(`/api/admin/promos/${p.id}`, { method: "DELETE" });
                  if (res.ok) setPromos((prev) => prev.filter((x) => x.id !== p.id));
                }}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                Удалить
              </button>
            </div>
          </div>
        );
      })}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6">
            <h3 className="font-semibold">Редактировать промокод</h3>
            <div className="mt-4 space-y-3">{formFields}</div>
            <div className="mt-6 flex gap-2">
              <button type="button" onClick={saveEdit} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800">
                Сохранить
              </button>
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl border px-4 py-2 text-sm hover:bg-zinc-50">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6">
            <h3 className="font-semibold">Новый промокод</h3>
            <div className="mt-4 space-y-3">{formFields}</div>
            <div className="mt-6 flex gap-2">
              <button type="button" onClick={saveCreate} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800">
                Создать
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setForm(emptyForm());
                }}
                className="rounded-xl border px-4 py-2 text-sm hover:bg-zinc-50"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
