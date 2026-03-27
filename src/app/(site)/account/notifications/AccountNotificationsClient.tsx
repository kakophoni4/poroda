"use client";

import { useCallback, useEffect, useState } from "react";
import { accountCardClass } from "../account-ui";

type N = { id: string; title: string; body: string | null; read: boolean; createdAt: string };

export default function AccountNotificationsClient() {
  const [items, setItems] = useState<N[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/account/notifications");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось загрузить");
        setItems([]);
        return;
      }
      setItems(data.notifications as N[]);
    } catch {
      setError("Ошибка сети");
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (id: string) => {
    await fetch("/api/account/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => (prev ? prev.map((n) => (n.id === id ? { ...n, read: true } : n)) : prev));
  };

  const markAllRead = async () => {
    await fetch("/api/account/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readAll: true }),
    });
    setItems((prev) => (prev ? prev.map((n) => ({ ...n, read: true })) : prev));
  };

  if (items === null) {
    return (
      <>
        <h1 className="text-2xl font-semibold">Уведомления</h1>
        <div className={`${accountCardClass} mt-6 h-40 animate-pulse`} />
      </>
    );
  }

  const hasUnread = items.some((n) => !n.read);

  return (
    <>
      <h1 className="text-2xl font-semibold">Уведомления</h1>
      {hasUnread && (
        <button
          type="button"
          onClick={() => void markAllRead()}
          className="mt-4 text-sm font-medium text-zinc-800 underline hover:text-zinc-600"
        >
          Отметить все прочитанными
        </button>
      )}
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className={`${accountCardClass} mt-8 text-center`}>
        {items.length === 0 ? (
          <p className="text-sm text-zinc-600">
            Пока нет уведомлений. После заказа, смены статуса или рассылки от администратора они появятся здесь.
          </p>
        ) : (
          <ul className="space-y-4 text-center">
            {items.map((n) => (
              <li key={n.id} className="border-b border-zinc-100 pb-4 last:border-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => {
                    if (!n.read) void markRead(n.id);
                  }}
                  className="w-full text-center"
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center justify-center gap-2">
                      <h3 className="font-medium text-zinc-900">{n.title}</h3>
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-zinc-900" title="Новое" />}
                    </div>
                    {n.body ? <p className="text-sm text-zinc-600">{n.body}</p> : null}
                    <p className="text-xs text-zinc-500">
                      {new Date(n.createdAt).toLocaleString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
