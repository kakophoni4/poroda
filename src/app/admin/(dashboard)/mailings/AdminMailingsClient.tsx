"use client";

import { useState } from "react";
import type { Mailing } from "@prisma/client";

type MailingRow = Mailing & { sentTo?: number };

function formatMailingStats(m: MailingRow) {
  const inbox = m.sentInbox != null ? m.sentInbox : m.sentTo;
  const ex = (v: number | null | undefined) => (v != null ? String(v) : "—");
  return { inbox: ex(inbox), emailOk: ex(m.sentEmailOk), emailFail: ex(m.sentEmailFail) };
}

export default function AdminMailingsClient({ initialMailings }: { initialMailings: MailingRow[] }) {
  const [mailings, setMailings] = useState<MailingRow[]>(initialMailings);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendInbox, setSendInbox] = useState(true);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const send = async () => {
    if (!subject.trim()) return;
    setFormError(null);
    setSending(true);
    const res = await fetch("/api/admin/mailings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: subject.trim(),
        body: body.trim(),
        sendEmail,
        sendInbox,
      }),
    });
    const data = await res.json();
    if (res.status === 429) {
      setFormError(data.error || "Слишком много запросов, попробуйте позже.");
    } else if (res.ok) {
      setMailings((prev) => [{ ...data, sentTo: data.sentTo }, ...prev]);
      setSubject("");
      setBody("");
    } else {
      setFormError(data.error || "Не удалось разослать");
    }
    setSending(false);
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-2xl border border-zinc-200 p-6">
        <h3 className="font-medium">Новая рассылка</h3>
        <p className="mt-1 text-sm text-zinc-600">
          Письмо (если включено) уйдёт только согласившимся пользователям с подтверждённой электронной
          почтой. В личный кабинет уведомления попадут у всех зарегистрированных пользователей, если
          эта опция включена.
        </p>
        {formError && <p className="mt-3 text-sm text-red-700">{formError}</p>}
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600">Тема</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              placeholder="Заголовок уведомления и письма"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Текст (HTML в рамках дозволенного)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              placeholder="Текст сообщения"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800">
              <input type="checkbox" checked={sendEmail} onChange={() => setSendEmail((v) => !v)} className="rounded" />
              Отправить на email
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800">
              <input
                type="checkbox"
                checked={sendInbox}
                onChange={() => setSendInbox((v) => !v)}
                className="rounded"
              />
              Отправить в личный кабинет
            </label>
          </div>
          <button
            type="button"
            onClick={send}
            disabled={sending || !subject.trim() || (!sendEmail && !sendInbox)}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {sending ? "Отправка…" : "Разослать"}
          </button>
        </div>
      </div>
      <div>
        <h3 className="font-medium">История рассылок</h3>
        <ul className="mt-2 space-y-2">
          {mailings.map((m) => {
            const s = formatMailingStats(m);
            return (
              <li key={m.id} className="rounded-lg border border-zinc-200 p-3 text-sm">
                <div className="font-medium">{m.subject}</div>
                {m.sentAt && <div className="text-zinc-500">{new Date(m.sentAt).toLocaleString("ru-RU")}</div>}
                {m.sentAt && (
                  <p className="mt-1 text-zinc-600">
                    Отправлено в ЛК: {s.inbox}
                    {", "}
                    на email: {s.emailOk}, ошибок: {s.emailFail}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
