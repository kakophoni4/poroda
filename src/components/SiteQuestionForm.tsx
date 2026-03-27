"use client";

import { useState } from "react";
import PhoneInput from "@/components/PhoneInput";
import { isRuPhoneComplete, ruPhoneNational10 } from "@/lib/phone-ru";

/** Форма «Задать вопрос» → /api/site-questions (админка «Вопросы с сайта») */
export default function SiteQuestionForm({ idPrefix = "site-q" }: { idPrefix?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+7");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setSending(true);
    try {
      const national = ruPhoneNational10(phone);
      if (national.length > 0 && !isRuPhoneComplete(phone)) {
        setErr("Укажите телефон полностью (+7(999)999-99-99) или оставьте только +7.");
        setSending(false);
        return;
      }
      const phonePayload = national.length === 10 ? phone : undefined;
      const res = await fetch("/api/site-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone: phonePayload, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Не удалось отправить.");
        return;
      }
      setMsg("Спасибо! Мы получили вопрос и ответим вам.");
      setBody("");
    } catch {
      setErr("Ошибка сети.");
    } finally {
      setSending(false);
    }
  };

  const i = (s: string) => `${idPrefix}-${s}`;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor={i("name")} className="block text-sm font-medium text-zinc-700">
          Имя
        </label>
        <input
          id={i("name")}
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="liquid-input mt-1 w-full rounded-xl px-4 py-2.5"
        />
      </div>
      <div>
        <label htmlFor={i("email")} className="block text-sm font-medium text-zinc-700">
          Email (необязательно)
        </label>
        <input
          id={i("email")}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="liquid-input mt-1 w-full rounded-xl px-4 py-2.5"
        />
      </div>
      <PhoneInput id={i("phone")} label="Телефон (необязательно)" value={phone} onChange={setPhone} />
      <div>
        <label htmlFor={i("body")} className="block text-sm font-medium text-zinc-700">
          Вопрос
        </label>
        <textarea
          id={i("body")}
          required
          minLength={10}
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="liquid-input mt-1 w-full rounded-xl px-4 py-2.5"
        />
      </div>
      {err && <p className="text-sm text-red-700">{err}</p>}
      {msg && <p className="text-sm text-emerald-800">{msg}</p>}
      <button
        type="submit"
        disabled={sending}
        className="rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {sending ? "Отправка…" : "Отправить вопрос"}
      </button>
    </form>
  );
}
