"use client";

import { useState } from "react";
import type { Product, Category } from "@prisma/client";

type ProductWithCat = Product & { category: Category };

const emptyForm = (): {
  slug: string;
  title: string;
  shortDesc: string;
  categoryId: string;
  price: number;
  oldPrice: number | "";
  isNew: boolean;
  skinTypes: string;
  imageUrl: string;
  imageUrls: string[];
  imageFocusX: number;
  imageFocusY: number;
  composition: string;
  components: string;
  extraField1: string;
  extraField2: string;
  featuredSortOrder: number | "";
} => ({
  slug: "",
  title: "",
  shortDesc: "",
  categoryId: "",
  price: 0,
  oldPrice: "" as number | "",
  isNew: false,
  skinTypes: "",
  imageUrl: "",
  imageUrls: [],
  imageFocusX: 50,
  imageFocusY: 50,
  composition: "",
  components: "",
  extraField1: "",
  extraField2: "",
  featuredSortOrder: "",
});

function ProductForm({
  form,
  setForm,
  categories,
  onSave,
  onCancel,
  title,
  saveLabel,
}: {
  form: ReturnType<typeof emptyForm>;
  setForm: React.Dispatch<React.SetStateAction<ReturnType<typeof emptyForm>>>;
  categories: Category[];
  onSave: () => void;
  onCancel: () => void;
  title: string;
  saveLabel: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
        <h3 className="font-semibold">{title}</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600">URL slug</label>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="gel-umyvanie"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Название</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Описание</label>
            <input
              value={form.shortDesc}
              onChange={(e) => setForm((f) => ({ ...f, shortDesc: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Категория</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">— выбрать —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600">Цена (₽)</label>
              <input
                type="number"
                value={form.price || ""}
                onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600">Пред. цена (акция)</label>
              <input
                type="number"
                value={form.oldPrice}
                onChange={(e) => setForm((f) => ({ ...f, oldPrice: e.target.value === "" ? "" : Number(e.target.value) }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="не задана"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Фото товара</label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (!files?.length) return;
                    for (let i = 0; i < files.length; i++) {
                      const fd = new FormData();
                      fd.set("file", files[i]);
                      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
                      if (res.ok) {
                        const { url } = await res.json();
                        setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, url] }));
                      }
                    }
                    e.target.value = "";
                  }}
                />
                <svg className="h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v12a2 2 0 002 2h12a2 2 0 002-2V16m-8-4l4-4m0 0l4 4m-4-4v12" /></svg>
                <span>Загрузить файл</span>
              </label>
            </div>
            {form.imageUrls.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-zinc-600 mb-1">Точка фокуса главного фото (как будет обрезаться в каталоге)</p>
                <p className="text-[11px] text-zinc-500 mb-2">Кликни по превью — эта точка будет в центре карточки</p>
                <div
                  className="relative aspect-square w-full max-w-[220px] cursor-crosshair overflow-hidden rounded-xl border-2 border-zinc-200 bg-zinc-100"
                  onClick={(e) => {
                    const t = e.currentTarget;
                    const rect = t.getBoundingClientRect();
                    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                    setForm((f) => ({ ...f, imageFocusX: Math.max(0, Math.min(100, x)), imageFocusY: Math.max(0, Math.min(100, y)) }));
                  }}
                >
                  <img
                    src={form.imageUrls[0]}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ objectPosition: `${form.imageFocusX}% ${form.imageFocusY}%` }}
                    draggable={false}
                  />
                  <div
                    className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full border-2 border-white shadow-lg bg-amber-500/80"
                    style={{ left: `${form.imageFocusX}%`, top: `${form.imageFocusY}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">Фокус: {form.imageFocusX}%, {form.imageFocusY}%</p>
              </div>
            )}
            <div className="mt-2 flex flex-wrap items-start gap-2">
              {form.imageUrls.map((url, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="relative">
                    <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover border border-zinc-200" />
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setForm((prev) => ({ ...prev, imageUrls: prev.imageUrls.filter((_, j) => j !== i) })); }}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600"
                      title="Удалить фото"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M6 6l12 12M6 18L18 6" /></svg>
                    </button>
                  </div>
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => setForm((prev) => {
                        const urls = [...prev.imageUrls];
                        [urls[i - 1], urls[i]] = [urls[i], urls[i - 1]];
                        return { ...prev, imageUrls: urls };
                      })}
                      className="rounded bg-zinc-100 p-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-200"
                      title="Поднять выше"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button
                      type="button"
                      disabled={i === form.imageUrls.length - 1}
                      onClick={() => setForm((prev) => {
                        const urls = [...prev.imageUrls];
                        [urls[i], urls[i + 1]] = [urls[i + 1], urls[i]];
                        return { ...prev, imageUrls: urls };
                      })}
                      className="rounded bg-zinc-100 p-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-200"
                      title="Опустить ниже"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Состав</label>
            <textarea
              value={form.composition}
              onChange={(e) => setForm((f) => ({ ...f, composition: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Компоненты</label>
            <textarea
              value={form.components}
              onChange={(e) => setForm((f) => ({ ...f, components: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Доп. поле 1</label>
            <input
              value={form.extraField1}
              onChange={(e) => setForm((f) => ({ ...f, extraField1: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Доп. поле 2</label>
            <input
              value={form.extraField2}
              onChange={(e) => setForm((f) => ({ ...f, extraField2: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isNew}
                onChange={(e) => setForm((f) => ({ ...f, isNew: e.target.checked }))}
              />
              <span className="text-sm">Новинка</span>
            </label>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Типы кожи (через запятую)</label>
            <input
              value={form.skinTypes}
              onChange={(e) => setForm((f) => ({ ...f, skinTypes: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Порядок на главной</label>
            <input
              type="number"
              min={0}
              value={form.featuredSortOrder === "" ? "" : form.featuredSortOrder}
              onChange={(e) => setForm((f) => ({ ...f, featuredSortOrder: e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value, 10) || 0) }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Пусто — не показывать; 1, 2, 3… — порядок в блоке «Рекомендуемое»"
            />
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onSave}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
          >
            {saveLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-zinc-50"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProductsClient({
  initialProducts,
  categories,
}: {
  initialProducts: ProductWithCat[];
  categories: Category[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [editing, setEditing] = useState<ProductWithCat | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const openEdit = (p: ProductWithCat) => {
    setEditing(p);
    const imageUrls = (p as { imageUrls?: string[] }).imageUrls?.length
      ? (p as { imageUrls?: string[] }).imageUrls!
      : (p.imageUrl ? [p.imageUrl] : []);
    const px = p as { imageFocusX?: number | null; imageFocusY?: number | null };
    setForm({
      slug: p.slug,
      title: p.title,
      shortDesc: p.shortDesc || "",
      categoryId: p.categoryId,
      price: p.price,
      oldPrice: p.oldPrice ?? "",
      isNew: p.isNew,
      skinTypes: Array.isArray(p.skinTypes) ? p.skinTypes.join(", ") : "",
      imageUrl: p.imageUrl || "",
      imageUrls,
      imageFocusX: px.imageFocusX != null ? px.imageFocusX : 50,
      imageFocusY: px.imageFocusY != null ? px.imageFocusY : 50,
      composition: p.composition || "",
      components: p.components || "",
      extraField1: p.extraField1 || "",
      extraField2: p.extraField2 || "",
      featuredSortOrder: (p as { featuredSortOrder?: number | null }).featuredSortOrder ?? "",
    });
  };

  const openCreate = () => {
    setCreating(true);
    setForm(emptyForm());
    setForm((f) => ({ ...f, categoryId: categories[0]?.id ?? "" }));
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
        imageUrls: form.imageUrls,
        imageFocusX: form.imageFocusX,
        imageFocusY: form.imageFocusY,
        featuredSortOrder: form.featuredSortOrder === "" ? null : form.featuredSortOrder,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProducts((prev) => prev.map((x) => (x.id === updated.id ? { ...updated, category: editing.category } : x)));
      setEditing(null);
    }
  };

  const saveCreate = async () => {
    if (!form.categoryId || !form.slug?.trim() || !form.title?.trim()) return;
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        oldPrice: form.oldPrice === "" ? null : Number(form.oldPrice),
        skinTypes: form.skinTypes ? form.skinTypes.split(",").map((s) => s.trim()).filter(Boolean) : [],
        imageUrls: form.imageUrls,
        imageFocusX: form.imageFocusX,
        imageFocusY: form.imageFocusY,
        featuredSortOrder: form.featuredSortOrder === "" ? null : form.featuredSortOrder,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      const cat = categories.find((c) => c.id === created.categoryId);
      setProducts((prev) => [...prev, { ...created, category: cat! }].sort((a, b) => a.title.localeCompare(b.title)));
      setCreating(false);
      setForm(emptyForm());
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          + Добавить товар
        </button>
      </div>

      {products.map((p) => (
        <div
          key={p.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 p-4"
        >
          <div className="flex items-center gap-4">
            {((p as { imageUrls?: string[] }).imageUrls?.[0] ?? p.imageUrl ?? "") ? (
              <img
                src={(p as { imageUrls?: string[] }).imageUrls?.[0] ?? p.imageUrl ?? ""}
                alt=""
                className="h-14 w-14 rounded-lg object-cover"
              />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-zinc-100" />
            )}
            <div>
              <span className="font-medium">{p.title}</span>
              <span className="ml-2 text-zinc-500">({p.category.title})</span>
              <p className="text-sm text-zinc-600">{p.price} ₽</p>
            </div>
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
                if (!confirm("Удалить товар?")) return;
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
        <ProductForm
          form={form}
          setForm={setForm}
          categories={categories}
          onSave={saveEdit}
          onCancel={() => setEditing(null)}
          title="Редактировать товар"
          saveLabel="Сохранить"
        />
      )}

      {creating && (
        <ProductForm
          form={form}
          setForm={setForm}
          categories={categories}
          onSave={saveCreate}
          onCancel={() => { setCreating(false); setForm(emptyForm()); }}
          title="Добавить товар"
          saveLabel="Создать"
        />
      )}
    </div>
  );
}
