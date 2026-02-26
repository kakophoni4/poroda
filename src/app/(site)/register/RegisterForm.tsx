"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: name || undefined, phone: phone || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Ошибка регистрации");
      return;
    }
    router.push("/account");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label htmlFor="reg-name" className="block text-sm font-medium text-zinc-700">Имя</label>
        <input id="reg-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5" />
      </div>
      <div>
        <label htmlFor="reg-email" className="block text-sm font-medium text-zinc-700">Email</label>
        <input id="reg-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5" />
      </div>
      <div>
        <label htmlFor="reg-phone" className="block text-sm font-medium text-zinc-700">Телефон</label>
        <input id="reg-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5" />
      </div>
      <div>
        <label htmlFor="reg-password" className="block text-sm font-medium text-zinc-700">Пароль</label>
        <input id="reg-password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="w-full rounded-2xl bg-zinc-900 py-3 text-sm font-medium text-white hover:bg-zinc-800">Зарегистрироваться</button>
    </form>
  );
}
