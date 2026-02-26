"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/account";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Ошибка входа");
      return;
    }
    router.push(from);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-zinc-700">Email</label>
        <input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5" />
      </div>
      <div>
        <label htmlFor="login-password" className="block text-sm font-medium text-zinc-700">Пароль</label>
        <input id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="w-full rounded-2xl bg-zinc-900 py-3 text-sm font-medium text-white hover:bg-zinc-800">Войти</button>
    </form>
  );
}
