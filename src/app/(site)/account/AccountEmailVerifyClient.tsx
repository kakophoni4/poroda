"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { accountCardClass } from "./account-ui";

type Props = {
  email: string;
  needsVerify: boolean;
};

export default function AccountEmailVerifyClient({ email, needsVerify }: Props) {
  const sp = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const justVerified = sp.get("verified") === "1";
  const hadInvalidLink = sp.get("verified") === "0" && sp.get("error") === "expired";

  async function resend() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email/resend", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = (await res.json()) as { error?: string; alreadyVerified?: boolean; ok?: boolean; retryAfterSec?: number };
      if (res.status === 429) {
        setErr(
          `Слишком часто. Повторите через ${
            data.retryAfterSec != null ? `~${data.retryAfterSec} с` : "час"
          }.`
        );
        return;
      }
      if (!res.ok) {
        setErr(data.error ?? "Не удалось отправить");
        return;
      }
      if (data.alreadyVerified) {
        router.refresh();
        return;
      }
    } catch {
      setErr("Сетевая ошибка. Повторите позже.");
    } finally {
      setLoading(false);
    }
  }

  if (!needsVerify) {
    if (justVerified) {
      return (
        <div
          className={`${accountCardClass} mb-8 border-emerald-200 bg-emerald-50/70 text-sm text-zinc-800 text-center`}
        >
          Email успешно подтверждён.
        </div>
      );
    }
    return null;
  }

  return (
    <div
      className={`${accountCardClass} ${
        hadInvalidLink
          ? "border-amber-300 bg-amber-50/70"
          : "border-amber-200/90 bg-amber-50/90 shadow-sm shadow-amber-900/5"
      } mb-6 text-left text-sm text-zinc-800 sm:mb-8`}
    >
      <p>
        <span className="font-medium text-amber-950/90">Подтвердите email</span> — мы отправили ссылку
        на{" "}
        <span className="whitespace-nowrap font-medium text-zinc-900">{email}</span>. Проверьте и
        папку «Спам».
      </p>
      {hadInvalidLink ? (
        <p className="mt-2 text-amber-900/90">Ссылка недействительна или срок действия истёк. Запросите новую.</p>
      ) : null}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center sm:gap-3">
        <button
          type="button"
          onClick={resend}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl border border-amber-400/80 bg-white px-4 py-2 text-sm font-medium text-amber-950 transition hover:bg-amber-100/80 disabled:opacity-60"
        >
          {loading ? "Отправка…" : "Отправить письмо ещё раз"}
        </button>
      </div>
      {err ? <p className="mt-2 text-center text-sm text-red-700">{err}</p> : null}
    </div>
  );
}
