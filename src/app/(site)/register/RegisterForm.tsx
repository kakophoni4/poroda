"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PhoneInput from "@/components/PhoneInput";
import { isRuPhoneComplete, ruPhoneNational10 } from "@/lib/phone-ru";
import { safeNextPath } from "@/lib/safe-redirect";

export default function RegisterForm() {
  const sp = useSearchParams();
  const fromParam = sp.get("from");
  const afterRegister = useMemo(() => safeNextPath(fromParam, "/account/orders"), [fromParam]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+7");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const e = sp.get("email");
    if (e) queueMicrotask(() => setEmail(decodeURIComponent(e)));
  }, [sp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const national = ruPhoneNational10(phone);
    if (national.length > 0 && !isRuPhoneComplete(phone)) {
      setError("Укажите телефон полностью в формате +7(999)999-99-99 или оставьте только +7");
      return;
    }
    const phonePayload = national.length === 10 ? phone : undefined;
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: name || undefined, phone: phonePayload }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Ошибка регистрации");
      return;
    }
    router.push(afterRegister);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label htmlFor="reg-name" className="block text-sm font-medium text-zinc-700">
          Имя
        </label>
        <input
          id="reg-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="liquid-input mt-1 w-full rounded-xl px-4 py-2.5"
        />
      </div>
      <div>
        <label htmlFor="reg-email" className="block text-sm font-medium text-zinc-700">
          Email
        </label>
        <input
          id="reg-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="liquid-input mt-1 w-full rounded-xl px-4 py-2.5"
        />
      </div>
      <PhoneInput id="reg-phone" label="Телефон (необязательно)" value={phone} onChange={setPhone} />
      <div>
        <label htmlFor="reg-password" className="block text-sm font-medium text-zinc-700">
          Пароль
        </label>
        <input
          id="reg-password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="liquid-input mt-1 w-full rounded-xl px-4 py-2.5"
        />
        <p className="mt-1.5 text-xs text-zinc-500">минимум 8 символов, буква и цифра</p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="w-full rounded-2xl bg-zinc-900 py-3 text-sm font-medium text-white hover:bg-zinc-800">
        Зарегистрироваться
      </button>
    </form>
  );
}
