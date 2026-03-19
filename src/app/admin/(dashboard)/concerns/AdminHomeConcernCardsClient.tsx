"use client";

import { useState } from "react";
import type { HomeConcernCard } from "@prisma/client";

const emptyForm = () => ({
  title: "",
  imageUrl: "",
  catalogQuery: "",
  sortOrder: 0 as number,
  active: true,
});

const CATEGORY_OPTIONS = [
  { value: "", label: "Вся продукция (/catalog)" },
  { value: "category=cleansing", label: "Очищение" },
  { value: "category=toners", label: "Тонизация" },
  { value: "category=serums", label: "Сыворотки" },
  { value: "category=creams", label: "Кремы" },
  { value: "category=masks", label: "Маски" },
  { value: "category=sets", label: "Наборы" },
];

export default function AdminHomeConcernCardsClient({ initial }: { initial: HomeConcernCard[] }) {
  const [list, setList] = useState(initial);
  const [editing, setEditing] = useState<HomeConcernCard | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "concerns");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setForm((f) => ({ ...f, imageUrl: data.url }));
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (row: HomeConcernCard) => {
    setEditing(row);
    setCreating(false);
    setForm({
      title: row.title,
      imageUrl: row.imageUrl,
      catalogQuery: row.catalogQuery || "",
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
    if (!editing || !form.title.trim() || !form.imageUrl.trim()) return;
    const res = await fetch(`/api/admin/home-concern-cards/${editing.id}`, {
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
    if (!form.title.trim() || !form.imageUrl.trim()) return;
    const res = await fetch("/api/admin/home-concern-cards", {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6">
        <h3 className="font-semibold">{creating ? "Новая карточка" : "Редактировать карточку"}</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600">Заголовок (обязательно)</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Акне и воспаления"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Фото (обязательно)</label>
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
            <input
              type="text"
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="/images/... или URL"
            />
            {form.imageUrl && (
              <img src={form.imageUrl} alt="" className="mt-2 max-h-28 w-full rounded-lg border object-cover" />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Фильтр каталога при клике</label>
            <select
              value={form.catalogQuery}
              onChange={(e) => setForm((f) => ({ ...f, catalogQuery: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-zinc-500">
              Ссылка будет: /catalog{form.catalogQuery ? `?${form.catalogQuery}` : ""}
            </p>
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
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            <span className="text-sm">Показывать на сайте</span>
          </label>
        </div>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={creating ? saveCreate : saveEdit}
            disabled={!form.title.trim() || !form.imageUrl.trim()}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
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
          + Новая карточка
        </button>
      </div>
      <p className="text-sm text-zinc-600">
        Карточки «Выберите вашу проблему» под баннерами: горизонтальная карусель (5 в ряд), свайп и кнопки без автопрокрутки. Выбор фильтра — куда ведёт клик в каталоге.
      </p>
      {list.map((row) => (
        <div key={row.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-zinc-200 p-4">
          <img src={row.imageUrl} alt="" className="h-16 w-24 rounded-lg border object-cover sm:h-20 sm:w-32" />
          <div className="min-w-0 flex-1">
            <div className="font-medium">{row.title}</div>
            <div className="mt-0.5 text-sm text-zinc-500">
              {row.active ? "Активна" : "Скрыта"} · порядок {row.sortOrder} · →
              {row.catalogQuery ? ` /catalog?${row.catalogQuery}` : " /catalog"}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => openEdit(row)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50"
            >
              Редактировать
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!confirm("Удалить карточку?")) return;
                const res = await fetch(`/api/admin/home-concern-cards/${row.id}`, { method: "DELETE" });
                if (res.ok) setList((prev) => prev.filter((x) => x.id !== row.id));
              }}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              Удалить
            </button>
          </div>
        </div>
      ))}
      {list.length === 0 && <p className="text-sm text-zinc-500">Нет карточек — добавьте первую.</p>}
      {editing && modal}
      {creating && modal}
    </div>
  );
}

function sortRows(a: HomeConcernCard, b: HomeConcernCard) {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}
