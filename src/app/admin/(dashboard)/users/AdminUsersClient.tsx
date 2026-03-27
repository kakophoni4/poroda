"use client";

import { useState } from "react";

type User = { id: string; email: string; name: string | null; phone: string | null; createdAt: Date; ordersCount: number };

export default function AdminUsersClient({ users: initialUsers }: { users: (User & { ordersCount: number })[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [notifyUser, setNotifyUser] = useState<User | null>(null);
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyBody, setNotifyBody] = useState("");
  const [notifyBusy, setNotifyBusy] = useState(false);

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ name: u.name || "", phone: u.phone || "" });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const res = await fetch(`/api/admin/users/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, phone: form.phone }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) => prev.map((x) => (x.id === updated.id ? { ...x, ...updated, ordersCount: x.ordersCount } : x)));
      setEditing(null);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-600">
              <th className="pb-3 pr-4">Имя</th>
              <th className="pb-3 pr-4">Email</th>
              <th className="pb-3 pr-4">Телефон</th>
              <th className="pb-3 pr-4">Заказов</th>
              <th className="pb-3 pr-4">Регистрация</th>
              <th className="pb-3">Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-zinc-100">
                <td className="py-3 pr-4">{u.name || "—"}</td>
                <td className="py-3 pr-4">{u.email}</td>
                <td className="py-3 pr-4">{u.phone || "—"}</td>
                <td className="py-3 pr-4">{u.ordersCount}</td>
                <td className="py-3 pr-4 text-zinc-500">{new Date(u.createdAt).toLocaleDateString("ru-RU")}</td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNotifyUser(u);
                        setNotifyTitle("");
                        setNotifyBody("");
                      }}
                      className="rounded-lg border border-violet-200 bg-violet-50 px-2 py-1 text-xs text-violet-900 hover:bg-violet-100"
                    >
                      Уведомление
                    </button>
                    <button type="button" onClick={() => openEdit(u)} className="rounded-lg border border-zinc-200 px-2 py-1 text-xs hover:bg-zinc-50">
                      Изменить
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm("Удалить пользователя? Заказы останутся, но без привязки к пользователю.")) return;
                        const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
                        if (res.ok) setUsers((prev) => prev.filter((x) => x.id !== u.id));
                      }}
                      className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {notifyUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h3 className="font-semibold">Уведомление в личный кабинет</h3>
            <p className="mt-1 text-sm text-zinc-500">{notifyUser.email}</p>
            <p className="mt-2 text-xs text-zinc-500">Сообщение появится у клиента в разделе «Уведомления».</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600">Заголовок</label>
                <input
                  value={notifyTitle}
                  onChange={(e) => setNotifyTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="Например: Скидка на ваш любимый продукт"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Текст (необязательно)</label>
                <textarea
                  value={notifyBody}
                  onChange={(e) => setNotifyBody(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                disabled={notifyBusy || !notifyTitle.trim()}
                onClick={async () => {
                  setNotifyBusy(true);
                  try {
                    const res = await fetch(`/api/admin/users/${notifyUser.id}/notifications`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ title: notifyTitle.trim(), body: notifyBody.trim() || undefined }),
                    });
                    if (res.ok) setNotifyUser(null);
                  } finally {
                    setNotifyBusy(false);
                  }
                }}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                Отправить
              </button>
              <button type="button" onClick={() => setNotifyUser(null)} className="rounded-xl border px-4 py-2 text-sm hover:bg-zinc-50">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h3 className="font-semibold">Редактировать клиента</h3>
            <p className="mt-1 text-sm text-zinc-500">{editing.email}</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600">Имя</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Телефон</label>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
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
