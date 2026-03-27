"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const TG = "https://t.me/porodacosmetics";

export default function ThanksClient() {
  const sp = useSearchParams();
  const orderId = sp.get("order") ?? "";
  const rt = sp.get("rt") ?? "";
  const emailHint = sp.get("email") ?? "";
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setLoggedIn(!!d?.user);
      })
      .catch(() => {
        if (!cancelled) setLoggedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!orderId) {
    return (
      <div className="frost-panel mt-8 rounded-3xl p-8 text-center text-zinc-700">
        <p>Не указан номер заказа. Если вы только что оплатили заказ, откройте ссылку из письма или вернитесь в каталог.</p>
        <Link href="/catalog" className="mt-4 inline-block font-medium text-zinc-900 underline">
          В каталог
        </Link>
      </div>
    );
  }

  const regHref = emailHint
    ? `/register?email=${encodeURIComponent(emailHint)}`
    : "/register";
  const loginHref = emailHint
    ? `/login?from=${encodeURIComponent("/account/orders")}&email=${encodeURIComponent(emailHint)}`
    : `/login?from=${encodeURIComponent("/account/orders")}`;

  return (
    <div className="mx-auto mt-8 max-w-lg">
      <div className="frost-panel rounded-3xl border border-emerald-200/60 bg-emerald-50/30 p-8 text-center sm:p-10">
        <p className="text-2xl font-semibold text-zinc-900">Спасибо за заказ!</p>
        <p className="mt-4 text-sm leading-relaxed text-zinc-700">
          В ближайшее время мы свяжемся с вами для уточнения деталей доставки.
        </p>
        <a
          href={TG}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex w-full max-w-xs justify-center rounded-2xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-sky-600"
        >
          Написать в Telegram
        </a>
        <p className="mt-2 text-xs text-zinc-500">Пока ждёте звонка — можно написать нам в мессенджер.</p>
      </div>

      <div className="liquidGlass-dock mt-6 rounded-3xl border border-white/50 p-6 sm:p-8">
        <p className="text-sm font-medium text-zinc-900">Личный кабинет</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Ваш заказ сохранён в системе. Зарегистрируйтесь или войдите с <strong>тем же email</strong>, что указали при
          оформлении — заказ появится в разделе «История заказов» со статусом (оформлен, в сборке, в доставке,
          доставлен).
        </p>
        {loggedIn === true ? (
          <Link
            href="/account/orders"
            className="mt-5 inline-flex rounded-2xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Перейти к заказам
          </Link>
        ) : (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={regHref}
              className="inline-flex justify-center rounded-2xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Зарегистрироваться
            </Link>
            <Link
              href={loginHref}
              className="inline-flex justify-center rounded-2xl border border-zinc-300 bg-white/80 px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-white"
            >
              Войти
            </Link>
          </div>
        )}
        <p className="mt-4 font-mono text-xs text-zinc-500">
          Номер заказа: <span className="select-all text-zinc-700">{orderId}</span>
        </p>
        {rt ? (
          <p className="mt-2 text-xs text-zinc-500">
            Сохраните эту страницу в закладках — по секретной ссылке после доставки можно будет оставить отзыв.
          </p>
        ) : null}
      </div>

      <div className="mt-8 text-center">
        <Link href="/catalog" className="text-sm font-medium text-zinc-700 underline hover:text-zinc-900">
          Вернуться в каталог
        </Link>
      </div>
    </div>
  );
}
