"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PASSWORD_HINT = "Минимум 8 символов, буква и цифра, не слишком распространённый пароль.";

export default function ResetPasswordClient({ token }: { token: string }) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("Пароли не совпадают");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json() as { error?: string; ok?: boolean };
      if (!res.ok) {
        setError(data.error || "Не удалось сбросить пароль");
        return;
      }
      router.push("/login?reset=1");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label htmlFor="reset-new" className="block text-sm font-medium text-zinc-700">
          Новый пароль
        </label>
        <input
          id="reset-new"
          type="password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="liquid-input mt-1 w-full rounded-xl px-4 py-2.5"
          autoComplete="new-password"
        />
        <p className="mt-1.5 text-xs text-zinc-500">{PASSWORD_HINT}</p>
      </div>
      <div>
        <label htmlFor="reset-confirm" className="block text-sm font-medium text-zinc-700">
          Повторите пароль
        </label>
        <input
          id="reset-confirm"
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="liquid-input mt-1 w-full rounded-xl px-4 py-2.5"
          autoComplete="new-password"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-zinc-900 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {loading ? "Сохранение…" : "Сохранить пароль"}
      </button>
    </form>
  );
}
