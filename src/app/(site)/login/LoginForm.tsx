"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { safeNextPath } from "@/lib/safe-redirect";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from");
  const from = useMemo(() => safeNextPath(fromParam, "/account"), [fromParam]);
  const justReset = searchParams.get("reset") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const e = searchParams.get("email");
    if (e) queueMicrotask(() => setEmail(decodeURIComponent(e)));
  }, [searchParams]);

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
      {justReset && (
        <p
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          role="status"
        >
          Пароль обновлён, войдите
        </p>
      )}
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-zinc-700">Email</label>
        <input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="liquid-input mt-1 w-full rounded-xl px-4 py-2.5" />
      </div>
      <div>
        <label htmlFor="login-password" className="block text-sm font-medium text-zinc-700">Пароль</label>
        <input id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="liquid-input mt-1 w-full rounded-xl px-4 py-2.5" />
        <p className="mt-1.5 text-right text-sm">
          <Link href="/forgot-password" className="font-medium text-zinc-700 underline hover:no-underline">
            Забыли пароль?
          </Link>
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="w-full rounded-2xl bg-zinc-900 py-3 text-sm font-medium text-white hover:bg-zinc-800">Войти</button>
    </form>
  );
}
