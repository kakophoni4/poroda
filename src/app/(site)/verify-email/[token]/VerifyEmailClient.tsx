"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type State = "loading" | "success" | "expired" | "invalid";

type ApiState = "success" | "expired" | "invalid";

export default function VerifyEmailClient({ token }: { token: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>("loading");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!token.trim()) {
        setState("invalid");
        return;
      }
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = (await res.json()) as { ok?: boolean; status?: ApiState; msg?: string };
        if (cancel) return;
        if (data.status === "success" && data.ok) {
          setState("success");
          router.refresh();
          return;
        }
        if (data.status === "expired") {
          setState("expired");
          if (data.msg) setErr(data.msg);
          return;
        }
        if (data.status === "invalid") {
          setState("invalid");
          if (data.msg) setErr(data.msg);
          return;
        }
        setState("invalid");
      } catch {
        if (!cancel) {
          setErr("Сетевая ошибка. Попробуйте снова из письма или запросите новую ссылку в кабинете.");
          setState("invalid");
        }
      }
    })();
    return () => {
      cancel = true;
    };
  }, [token, router]);

  if (state === "loading") {
    return <p className="mt-6 text-center text-sm text-zinc-600">Проверяем ссылку…</p>;
  }

  if (state === "success") {
    return (
      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-zinc-800 text-center">
        <p className="font-medium text-emerald-900">Email подтверждён</p>
        <p className="mt-1 text-zinc-700">Можно открыть личный кабинет — жёлтая плашка с напоминанием больше не появится.</p>
        <p className="mt-4">
          <Link
            href="/account"
            className="font-medium text-zinc-900 underline decoration-zinc-400/80 hover:no-underline"
          >
            В личный кабинет
          </Link>
        </p>
      </div>
    );
  }

  if (state === "expired") {
    return (
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-zinc-800 text-center">
        <p className="font-medium">Срок ссылки истёк</p>
        <p className="mt-1 text-zinc-700">Запросите новую ссылку в личном кабинете.</p>
        <p className="mt-4">
          <Link href="/account" className="font-medium text-zinc-900 underline decoration-zinc-400/80 hover:no-underline">
            В кабинет
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-800 text-center">
      <p className="font-medium">Ссылка недействительна</p>
      {err ? (
        <p className="mt-1 text-zinc-700">{err}</p>
      ) : (
        <p className="mt-1 text-zinc-700">Возможно, вы уже подтвердили адрес. Иначе запросите новую ссылку в кабинете.</p>
      )}
      <p className="mt-4">
        <Link href="/account" className="font-medium text-zinc-900 underline decoration-zinc-400/80 hover:no-underline">
          В кабинет
        </Link>
      </p>
    </div>
  );
}
