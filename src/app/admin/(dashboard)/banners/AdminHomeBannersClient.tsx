"use client";

import { useState } from "react";
import type { HomePromoBanner } from "@prisma/client";

const emptyForm = () => ({
  imageUrl: "",
  linkUrl: "",
  buttonText: "",
  buttonColor: "#18181b",
  sortOrder: 0 as number,
  active: true,
});

export default function AdminHomeBannersClient({ initial }: { initial: HomePromoBanner[] }) {
  const [list, setList] = useState(initial);
  const [editing, setEditing] = useState<HomePromoBanner | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "banners");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setForm((f) => ({ ...f, imageUrl: data.url }));
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (row: HomePromoBanner) => {
    setEditing(row);
    setCreating(false);
    setForm({
      imageUrl: row.imageUrl,
      linkUrl: row.linkUrl,
      buttonText: row.buttonText,
      buttonColor: row.buttonColor || "#18181b",
      sortOrder: row.sortOrder,
      active: row.active,
    });
  };

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm(emptyForm());
  };

  const showError = async (res: Response) => {
    const data = await res.json().catch(() => ({}));
    alert((data as { error?: string }).error || `Ошибка ${res.status}`);
  };

  const saveEdit = async () => {
    if (!editing || !form.imageUrl.trim()) return;
    const res = await fetch(`/api/admin/home-promo-banners/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const updated = await res.json();
      setList((prev) => prev.map((x) => (x.id === updated.id ? updated : x)).sort(sortRows));
      setEditing(null);
    } else {
      await showError(res);
    }
  };

  const saveCreate = async () => {
    if (!form.imageUrl.trim()) return;
    const res = await fetch("/api/admin/home-promo-banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const created = await res.json();
      setList((prev) => [...prev, created].sort(sortRows));
      setCreating(false);
      setForm(emptyForm());
    } else {
      await showError(res);
    }
  };

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6">
        <h3 className="font-semibold">{creating ? "Новый баннер" : "Редактировать баннер"}</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600">Фото баннера (обязательно)</label>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadImage(f);
                  e.target.value = "";
                }}
                className="text-sm"
              />
              {uploading && <span className="text-xs text-zinc-500">Загрузка…</span>}
            </div>
            <p className="mt-1 text-xs text-zinc-500">Или укажите URL картинки (например /images/obshchie/hero.jpg):</p>
            <input
              type="text"
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="/images/... или полный URL"
            />
            {form.imageUrl && (
              <img src={form.imageUrl} alt="" className="mt-2 max-h-32 w-full rounded-lg border object-cover" />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Ссылка кнопки (URL или /catalog и т.п.)</label>
            <input
              value={form.linkUrl}
              onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="/catalog или https://..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Текст на кнопке</label>
            <input
              value={form.buttonText}
              onChange={(e) => setForm((f) => ({ ...f, buttonText: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Купить со скидкой"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600">Цвет кнопки</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={form.buttonColor.match(/^#[0-9A-Fa-f]{6}$/) ? form.buttonColor : "#18181b"}
                  onChange={(e) => setForm((f) => ({ ...f, buttonColor: e.target.value }))}
                  className="h-10 w-14 cursor-pointer rounded border"
                />
                <input
                  value={form.buttonColor}
                  onChange={(e) => setForm((f) => ({ ...f, buttonColor: e.target.value }))}
                  className="w-28 rounded-lg border px-2 py-2 font-mono text-sm"
                  placeholder="#18181b"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600">Порядок (меньше — раньше)</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))}
                className="mt-1 w-24 rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
            <span className="text-sm">Показывать на сайте</span>
          </label>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {!form.imageUrl.trim() && (
            <span className="text-xs text-amber-600">Сначала загрузите фото или введите URL выше — тогда кнопка станет активной.</span>
          )}
          <button
            type="button"
            onClick={creating ? saveCreate : saveEdit}
            disabled={!form.imageUrl.trim()}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? "Создать" : "Сохранить"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
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
  );

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          + Новый баннер
        </button>
      </div>
      <p className="text-sm text-zinc-600">
        На главной баннеры на всю ширину экрана: прокрутка колёсиком мыши вбок и кнопки ‹ ›. Если не задать ссылку и текст кнопки — показывается только картинка.
      </p>
      {list.map((row) => (
        <div key={row.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-zinc-200 p-4">
          <img src={row.imageUrl} alt="" className="h-20 w-40 rounded-lg border object-cover sm:h-24 sm:w-48" />
          <div className="min-w-0 flex-1">
            <div className="text-sm">
              <span className={row.active ? "text-green-700" : "text-zinc-400"}>{row.active ? "Активен" : "Скрыт"}</span>
              <span className="ml-2 text-zinc-500">порядок {row.sortOrder}</span>
            </div>
            {row.buttonText && (
              <p className="mt-1 truncate text-sm">
                Кнопка: «{row.buttonText}» → {row.linkUrl || "—"}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => openEdit(row)} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50">
              Редактировать
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!confirm("Удалить баннер?")) return;
                const res = await fetch(`/api/admin/home-promo-banners/${row.id}`, { method: "DELETE" });
                if (res.ok) setList((prev) => prev.filter((x) => x.id !== row.id));
              }}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              Удалить
            </button>
          </div>
        </div>
      ))}
      {list.length === 0 && <p className="text-sm text-zinc-500">Пока нет баннеров — добавьте первый.</p>}
      {editing && modal}
      {creating && modal}
    </div>
  );
}

function sortRows(a: HomePromoBanner, b: HomePromoBanner) {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}
