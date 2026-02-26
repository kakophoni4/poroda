"use client";

import { useState } from "react";
import type { Mailing } from "@prisma/client";

export default function AdminMailingsClient({ initialMailings }: { initialMailings: Mailing[] }) {
  const [mailings, setMailings] = useState(initialMailings);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!subject.trim()) return;
    setSending(true);
    const res = await fetch("/api/admin/mailings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: subject.trim(), body: body.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setMailings((prev) => [{ ...data, sentTo: data.sentTo }, ...prev]);
      setSubject("");
      setBody("");
    }
    setSending(false);
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-2xl border border-zinc-200 p-6">
        <h3 className="font-medium">Новая рассылка</h3>
        <p className="mt-1 text-sm text-zinc-600">Тема и текст попадут в раздел «Уведомления» у всех зарегистрированных пользователей.</p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600">Тема</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm" placeholder="Заголовок уведомления" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Текст</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm" placeholder="Текст сообщения" />
          </div>
          <button type="button" onClick={send} disabled={sending || !subject.trim()} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50">
            {sending ? "Отправка…" : "Разослать в кабинеты"}
          </button>
        </div>
      </div>
      <div>
        <h3 className="font-medium">История рассылок</h3>
        <ul className="mt-2 space-y-2">
          {mailings.map((m) => (
            <li key={m.id} className="rounded-lg border border-zinc-200 p-3 text-sm">
              <span className="font-medium">{m.subject}</span>
              {m.sentAt && <span className="ml-2 text-zinc-500">{new Date(m.sentAt).toLocaleString("ru-RU")}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
