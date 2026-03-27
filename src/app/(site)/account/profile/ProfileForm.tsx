"use client";

import { useCallback, useEffect, useState } from "react";
import PhoneInput from "@/components/PhoneInput";
import { formatRuPhoneFromStored, isRuPhoneComplete } from "@/lib/phone-ru";
import { accountCardClass } from "../account-ui";

type UserRow = { id: string; email: string; name: string | null; phone: string | null };

export default function ProfileForm() {
  const [user, setUser] = useState<UserRow | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/profile");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось загрузить профиль");
        setUser(null);
        return;
      }
      const u = data.user as UserRow;
      setUser(u);
      setName(u.name || "");
      setPhone(formatRuPhoneFromStored(u.phone));
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    if (!isRuPhoneComplete(phone)) {
      setError("Укажите телефон полностью в формате +7(999)999-99-99");
      setSaving(false);
      return;
    }
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось сохранить");
        return;
      }
      setUser(data.user);
      setMessage("Сохранено");
    } catch {
      setError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={`${accountCardClass} mx-auto mt-6 h-40 max-w-md animate-pulse`} />;
  }

  if (!user) {
    return error ? <p className="mt-6 text-sm text-red-700">{error}</p> : null;
  }

  return (
    <form onSubmit={save} className="mx-auto mt-6 max-w-md space-y-4 text-center">
      <div>
        <label htmlFor="profile-name" className="block text-sm font-medium text-zinc-700">
          Имя
        </label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="liquid-input mt-1 w-full rounded-xl px-4 py-2.5"
        />
      </div>
      <div>
        <label htmlFor="profile-email" className="block text-sm font-medium text-zinc-700">
          Email
        </label>
        <input
          id="profile-email"
          type="email"
          value={user.email}
          readOnly
          className="liquid-input mt-1 w-full cursor-not-allowed rounded-xl bg-zinc-100/80 px-4 py-2.5 text-zinc-600"
        />
        <p className="mt-1 text-xs text-zinc-500">Email привязан к аккаунту. Смена — через поддержку.</p>
      </div>
      <PhoneInput id="profile-phone" label="Телефон" value={phone} onChange={setPhone} required />
      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-emerald-800">{message}</p>}
      <button
        type="submit"
        disabled={saving}
        className="mx-auto block rounded-2xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {saving ? "Сохранение…" : "Сохранить"}
      </button>
    </form>
  );
}
