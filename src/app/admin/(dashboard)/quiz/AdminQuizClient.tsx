"use client";

import { useState, useCallback } from "react";

type QuizAnswerRow = {
  id: string;
  questionId: string;
  label: string;
  linkUrl: string;
  nextQuestionId: string | null;
  sortOrder: number;
};

type QuizQuestionRow = {
  id: string;
  title: string;
  sortOrder: number;
  active: boolean;
  answers: QuizAnswerRow[];
};

const emptyQuestion = (): { title: string; sortOrder: number; active: boolean } => ({
  title: "",
  sortOrder: 0,
  active: true,
});

const emptyAnswer = (questionId: string): { questionId: string; label: string; linkUrl: string; nextQuestionId: string | null; sortOrder: number } => ({
  questionId,
  label: "",
  linkUrl: "",
  nextQuestionId: null,
  sortOrder: 0,
});

export default function AdminQuizClient({ initial }: { initial: QuizQuestionRow[] }) {
  const [list, setList] = useState<QuizQuestionRow[]>(initial);
  const [editQ, setEditQ] = useState<QuizQuestionRow | null>(null);
  const [createQ, setCreateQ] = useState(false);
  const [qForm, setQForm] = useState(emptyQuestion());
  const [editA, setEditA] = useState<QuizAnswerRow | null>(null);
  const [createA, setCreateA] = useState<{ questionId: string } | null>(null);
  const [aForm, setAForm] = useState<{ questionId: string; label: string; linkUrl: string; nextQuestionId: string | null; sortOrder: number } | null>(null);

  const showError = useCallback(async (res: Response) => {
    const data = await res.json().catch(() => ({}));
    alert((data as { error?: string }).error || `Ошибка ${res.status}`);
  }, []);

  const loadList = useCallback(async () => {
    const res = await fetch("/api/admin/quiz");
    if (res.ok) {
      const data = await res.json();
      setList(data);
    }
  }, []);

  const openEditQuestion = (q: QuizQuestionRow) => {
    setEditQ(q);
    setCreateQ(false);
    setQForm({ title: q.title, sortOrder: q.sortOrder, active: q.active });
  };

  const openCreateQuestion = () => {
    setCreateQ(true);
    setEditQ(null);
    setQForm(emptyQuestion());
  };

  const saveQuestion = async () => {
    if (!qForm.title.trim()) return;
    if (createQ) {
      const res = await fetch("/api/admin/quiz-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(qForm),
      });
      if (res.ok) {
        const created = await res.json();
        setList((prev) => [...prev, { ...created, answers: [] }].sort((a, b) => a.sortOrder - b.sortOrder));
        setCreateQ(false);
        setQForm(emptyQuestion());
      } else await showError(res);
    } else if (editQ) {
      const res = await fetch(`/api/admin/quiz-questions/${editQ.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(qForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setList((prev) =>
          prev.map((x) => (x.id === updated.id ? { ...x, ...updated, answers: x.answers } : x)).sort((a, b) => a.sortOrder - b.sortOrder)
        );
        setEditQ(null);
      } else await showError(res);
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm("Удалить вопрос и все его ответы?")) return;
    const res = await fetch(`/api/admin/quiz-questions/${id}`, { method: "DELETE" });
    if (res.ok) setList((prev) => prev.filter((x) => x.id !== id));
    else await showError(res);
  };

  const openEditAnswer = (a: QuizAnswerRow) => {
    setEditA(a);
    setCreateA(null);
    setAForm({ questionId: a.questionId, label: a.label, linkUrl: a.linkUrl, nextQuestionId: a.nextQuestionId, sortOrder: a.sortOrder });
  };

  const openCreateAnswer = (questionId: string) => {
    setCreateA({ questionId });
    setEditA(null);
    setAForm(emptyAnswer(questionId));
  };

  const saveAnswer = async () => {
    if (!aForm || !aForm.label.trim()) return;
    if (createA) {
      const res = await fetch("/api/admin/quiz-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aForm),
      });
      if (res.ok) {
        const created = await res.json();
        setList((prev) =>
          prev.map((q) =>
            q.id === created.questionId ? { ...q, answers: [...q.answers, created].sort((a, b) => a.sortOrder - b.sortOrder) } : q
          )
        );
        setCreateA(null);
        setAForm(null);
      } else await showError(res);
    } else if (editA) {
      const res = await fetch(`/api/admin/quiz-answers/${editA.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: aForm.label,
          linkUrl: aForm.linkUrl,
          nextQuestionId: aForm.nextQuestionId,
          sortOrder: aForm.sortOrder,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setList((prev) =>
          prev.map((q) =>
            q.id === updated.questionId
              ? { ...q, answers: q.answers.map((a) => (a.id === updated.id ? updated : a)).sort((a, b) => a.sortOrder - b.sortOrder) }
              : q
          )
        );
        setEditA(null);
        setAForm(null);
      } else await showError(res);
    }
  };

  const deleteAnswer = async (id: string) => {
    if (!confirm("Удалить ответ?")) return;
    const res = await fetch(`/api/admin/quiz-answers/${id}`, { method: "DELETE" });
    if (res.ok) {
      setList((prev) =>
        prev.map((q) => ({ ...q, answers: q.answers.filter((a) => a.id !== id) }))
      );
    } else await showError(res);
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreateQuestion}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          + Новый вопрос
        </button>
      </div>

      {list.length === 0 && <p className="text-sm text-zinc-500">Нет вопросов. Добавьте первый — он будет показан в квизе первым.</p>}

      {list.map((q) => (
        <div key={q.id} className="rounded-xl border border-zinc-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-medium">{q.title || "(без заголовка)"}</span>
              <span className="ml-2 text-sm text-zinc-500">
                {q.active ? "· активен" : "· скрыт"} · порядок {q.sortOrder} · ответов: {q.answers.length}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => openEditQuestion(q)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50"
              >
                Редактировать
              </button>
              <button
                type="button"
                onClick={() => openCreateAnswer(q.id)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50"
              >
                + Ответ
              </button>
              <button
                type="button"
                onClick={() => deleteQuestion(q.id)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                Удалить
              </button>
            </div>
          </div>
          <ul className="mt-3 space-y-2 pl-4">
            {q.answers.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{a.label}</span>
                <span className="text-zinc-500">
                  → {a.nextQuestionId ? `след. вопрос` : a.linkUrl || "(нет ссылки)"}
                </span>
                <button
                  type="button"
                  onClick={() => openEditAnswer(a)}
                  className="text-zinc-500 hover:text-zinc-700"
                >
                  изменить
                </button>
                <button
                  type="button"
                  onClick={() => deleteAnswer(a.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  удалить
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Modal: question */}
      {(editQ || createQ) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6">
            <h3 className="font-semibold">{createQ ? "Новый вопрос" : "Редактировать вопрос"}</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600">Заголовок (текст в шапке квиза)</label>
                <input
                  value={qForm.title}
                  onChange={(e) => setQForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="Выберите тип вашей кожи"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Порядок (меньше — раньше)</label>
                <input
                  type="number"
                  value={qForm.sortOrder}
                  onChange={(e) => setQForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))}
                  className="mt-1 w-24 rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={qForm.active}
                  onChange={(e) => setQForm((f) => ({ ...f, active: e.target.checked }))}
                />
                <span className="text-sm">Вопрос активен (показывать в квизе)</span>
              </label>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={saveQuestion}
                disabled={!qForm.title.trim()}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {createQ ? "Создать" : "Сохранить"}
              </button>
              <button
                type="button"
                onClick={() => { setEditQ(null); setCreateQ(false); setQForm(emptyQuestion()); }}
                className="rounded-xl border px-4 py-2 text-sm hover:bg-zinc-50"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: answer */}
      {(editA || createA) && aForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6">
            <h3 className="font-semibold">{createA ? "Новый ответ" : "Редактировать ответ"}</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600">Текст варианта</label>
                <input
                  value={aForm.label}
                  onChange={(e) => setAForm((f) => f ? { ...f, label: e.target.value } : f)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="Сухая"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Ссылка (если пусто — можно выбрать следующий вопрос)</label>
                <input
                  value={aForm.linkUrl}
                  onChange={(e) => setAForm((f) => f ? { ...f, linkUrl: e.target.value } : f)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="/catalog?skin=dry или /catalog/slug"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Или следующий вопрос (если задан — переход по ссылке не используется)</label>
                <select
                  value={aForm.nextQuestionId ?? ""}
                  onChange={(e) =>
                    setAForm((f) =>
                      f ? { ...f, nextQuestionId: e.target.value ? e.target.value : null } : f
                    )
                  }
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="">— Нет (использовать ссылку выше)</option>
                  {list.filter((qu) => qu.id !== aForm.questionId).map((qu) => (
                    <option key={qu.id} value={qu.id}>
                      {qu.title || qu.id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Порядок ответа</label>
                <input
                  type="number"
                  value={aForm.sortOrder}
                  onChange={(e) => setAForm((f) => f ? { ...f, sortOrder: Number(e.target.value) || 0 } : f)}
                  className="mt-1 w-24 rounded-lg border px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={saveAnswer}
                disabled={!aForm.label.trim()}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {createA ? "Создать" : "Сохранить"}
              </button>
              <button
                type="button"
                onClick={() => { setEditA(null); setCreateA(null); setAForm(null); }}
                className="rounded-xl border px-4 py-2 text-sm hover:bg-zinc-50"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
