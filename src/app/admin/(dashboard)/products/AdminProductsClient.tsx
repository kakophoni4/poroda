"use client";

import { useState } from "react";
import type { Product, Category } from "@prisma/client";

type ProductWithCat = Product & { category: Category };

export default function AdminProductsClient({
  initialProducts,
  categories,
}: {
  initialProducts: ProductWithCat[];
  categories: Category[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [editing, setEditing] = useState<ProductWithCat | null>(null);
  const [form, setForm] = useState({ slug: "", title: "", shortDesc: "", categoryId: "", price: 0, oldPrice: "" as number | "", isNew: false, skinTypes: "" });

  const openEdit = (p: ProductWithCat) => {
    setEditing(p);
    setForm({
      slug: p.slug,
      title: p.title,
      shortDesc: p.shortDesc || "",
      categoryId: p.categoryId,
      price: p.price,
      oldPrice: p.oldPrice ?? "",
      isNew: p.isNew,
      skinTypes: Array.isArray(p.skinTypes) ? p.skinTypes.join(", ") : "",
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const res = await fetch(`/api/admin/products/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        oldPrice: form.oldPrice === "" ? null : Number(form.oldPrice),
        skinTypes: form.skinTypes ? form.skinTypes.split(",").map((s) => s.trim()).filter(Boolean) : [],
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProducts((prev) => prev.map((x) => (x.id === updated.id ? { ...updated, category: editing.category } : x)));
      setEditing(null);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      {products.map((p) => (
        <div key={p.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 p-4">
          <div>
            <span className="font-medium">{p.title}</span>
            <span className="ml-2 text-zinc-500">({p.category.title})</span>
            <p className="text-sm text-zinc-600">{p.price} ₽</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => openEdit(p)} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50">
              Редактировать
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!confirm("Удалить?")) return;
                const res = await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
                if (res.ok) setProducts((prev) => prev.filter((x) => x.id !== p.id));
              }}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              Удалить
            </button>
          </div>
        </div>
      ))}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
            <h3 className="font-semibold">Редактировать товар</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600">slug</label>
                <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Название</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Описание</label>
                <input value={form.shortDesc} onChange={(e) => setForm((f) => ({ ...f, shortDesc: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Категория</label>
                <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Цена</label>
                  <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Старая цена</label>
                  <input type="number" value={form.oldPrice} onChange={(e) => setForm((f) => ({ ...f, oldPrice: e.target.value === "" ? "" : Number(e.target.value) }))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isNew} onChange={(e) => setForm((f) => ({ ...f, isNew: e.target.checked }))} />
                  <span className="text-sm">Новинка</span>
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Типы кожи (через запятую)</label>
                <input value={form.skinTypes} onChange={(e) => setForm((f) => ({ ...f, skinTypes: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
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
