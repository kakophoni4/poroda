"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Ошибка входа");
      return;
    }
    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center py-12">
      <Container className="max-w-sm">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8">
          <h1 className="text-xl font-semibold">Вход для администратора</h1>
          <p className="mt-1 text-sm text-zinc-600">Отдельный логин от пользовательского кабинета.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-zinc-700">Email</label>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5"
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-zinc-700">Пароль</label>
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="w-full rounded-2xl bg-zinc-900 py-3 text-sm font-medium text-white hover:bg-zinc-800">
              Войти
            </button>
          </form>
          <a href="/" className="mt-4 block text-center text-sm text-zinc-500 hover:text-zinc-700">← На сайт</a>
        </div>
      </Container>
    </div>
  );
}
