"use client";

import { useState } from "react";
import type { SiteQuestion } from "@prisma/client";

export default function AdminQuestionsClient({ initial }: { initial: SiteQuestion[] }) {
  const [rows, setRows] = useState<SiteQuestion[]>(initial);

  const setStatus = async (id: string, status: "new" | "done") => {
    const res = await fetch(`/api/admin/site-questions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return;
    const row = await res.json();
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, status: row.status } : x)));
  };

  if (rows.length === 0) {
    return <p className="mt-6 text-sm text-zinc-500">Пока нет вопросов.</p>;
  }

  return (
    <div className="mt-6 space-y-5">
      {rows.map((q) => (
        <div
          key={q.id}
          className={`rounded-xl border p-4 ${q.status === "new" ? "border-amber-200 bg-amber-50/30" : "border-zinc-200"}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">{q.name}</span>
            <span className="text-xs text-zinc-500">{new Date(q.createdAt).toLocaleString("ru-RU")}</span>
          </div>
          <div className="mt-1 text-sm text-zinc-600">
            {[q.email, q.phone].filter(Boolean).join(" · ") || "Контакты не указаны"}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-800">{q.body}</p>
          <div className="mt-3 flex gap-2">
            {q.status === "new" ? (
              <button
                type="button"
                onClick={() => setStatus(q.id, "done")}
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-800"
              >
                Отметить обработанным
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStatus(q.id, "new")}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
              >
                Вернуть в «новые»
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
