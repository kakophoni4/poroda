"use client";

import { useState } from "react";

type ArticleRow = {
  id: string;
  title: string;
  linkUrl: string;
  description: string;
  sortOrder: number;
  active: boolean;
};

const emptyForm = (): { title: string; linkUrl: string; description: string; sortOrder: number; active: boolean } => ({
  title: "",
  linkUrl: "",
  description: "",
  sortOrder: 0,
  active: true,
});

export default function AdminArticlesClient({ initial }: { initial: ArticleRow[] }) {
  const [list, setList] = useState(initial);
  const [editing, setEditing] = useState<ArticleRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const openEdit = (row: ArticleRow) => {
    setEditing(row);
    setCreating(false);
    setForm({
      title: row.title,
      linkUrl: row.linkUrl,
      description: row.description,
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
    if (!editing || !form.title.trim()) return;
    const res = await fetch(`/api/admin/home-articles/${editing.id}`, {
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
    if (!form.title.trim()) return;
    const res = await fetch("/api/admin/home-articles", {
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
        <h3 className="font-semibold">{creating ? "Новая статья" : "Редактировать статью"}</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600">Название статьи (обязательно)</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Порядок нанесения: что за чем"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Ссылка (куда перейти при клике)</label>
            <input
              value={form.linkUrl}
              onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="/blog/order или https://..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Описание (краткий текст на карточке)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              rows={3}
              placeholder="Чтобы активы работали, а кожа чувствовала себя спокойно."
            />
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
            <span className="text-sm">Показывать на главной</span>
          </label>
        </div>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={creating ? saveCreate : saveEdit}
            disabled={!form.title.trim()}
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
          + Новая статья
        </button>
      </div>
      {list.map((row) => (
        <div key={row.id} className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-zinc-200 p-4">
          <div className="min-w-0 flex-1">
            <div className="font-medium">{row.title}</div>
            <div className="mt-0.5 text-sm text-zinc-500">
              {row.active ? "На главной" : "Скрыта"} · порядок {row.sortOrder}
            </div>
            {row.linkUrl && <div className="mt-0.5 text-xs text-zinc-500">→ {row.linkUrl}</div>}
            {row.description && <p className="mt-2 text-sm text-zinc-700 line-clamp-2">{row.description}</p>}
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
                if (!confirm("Удалить статью?")) return;
                const res = await fetch(`/api/admin/home-articles/${row.id}`, { method: "DELETE" });
                if (res.ok) setList((prev) => prev.filter((x) => x.id !== row.id));
                else await showError(res);
              }}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              Удалить
            </button>
          </div>
        </div>
      ))}
      {list.length === 0 && <p className="text-sm text-zinc-500">Нет статей — добавьте первую.</p>}
      {editing && modal}
      {creating && modal}
    </div>
  );
}

function sortRows(a: ArticleRow, b: ArticleRow) {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return 0;
}
