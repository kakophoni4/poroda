"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1" role="group" aria-label="Оценка">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-2xl leading-none transition ${n <= value ? "text-amber-500" : "text-zinc-300"} hover:scale-110`}
          aria-label={`Оценка ${n} из 5`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

type StatusPayload = {
  hasReview: boolean;
  status: string | null;
  rewardCode: string | null;
  orderStatus?: string;
  orderStatusLabel?: string;
  canReview?: boolean;
};

export default function OrderReviewClient() {
  const sp = useSearchParams();
  const orderId = sp.get("order") ?? "";
  const token = sp.get("rt") ?? "";

  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(5);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [ui, setUi] = useState<"loading" | "form" | "sent" | "wait_delivery">("loading");
  const [error, setError] = useState<string | null>(null);
  const [rewardCode, setRewardCode] = useState<string | null>(null);
  const [reviewState, setReviewState] = useState<string | null>(null);
  const [orderStatusLabelText, setOrderStatusLabelText] = useState<string | null>(null);

  const statusUrl = useCallback(() => {
    const qs = new URLSearchParams({ orderId });
    if (token) qs.set("token", token);
    return `/api/reviews/status?${qs.toString()}`;
  }, [orderId, token]);

  const refreshStatus = useCallback(async () => {
    if (!orderId) {
      setUi("form");
      setError("Откройте форму по ссылке после заказа или из личного кабинета.");
      return;
    }
    setError(null);
    try {
      const res = await fetch(statusUrl());
      const data = (await res.json()) as StatusPayload & { error?: string };
      if (!res.ok) {
        setUi("form");
        setError(data.error || "Не удалось проверить доступ к заказу. Войдите в аккаунт или используйте ссылку из письма.");
        return;
      }
      if (data.orderStatusLabel) setOrderStatusLabelText(data.orderStatusLabel);
      if (!data.hasReview && data.canReview === false) {
        setUi("wait_delivery");
        return;
      }
      if (!data.hasReview) {
        setUi("form");
        return;
      }
      setReviewState(data.status);
      if (data.status === "approved" && data.rewardCode) {
        setRewardCode(data.rewardCode);
      }
      setUi("sent");
    } catch {
      setUi("form");
      setError("Ошибка сети.");
    }
  }, [orderId, statusUrl]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const uploadFile = async (file: File) => {
    if (!orderId) return;
    setUploadBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("orderId", orderId);
      fd.set("file", file);
      if (token) fd.set("token", token);
      const res = await fetch("/api/reviews/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось загрузить фото");
        return;
      }
      if (data.url) {
        setUploadedUrls((u) => (u.length >= 6 ? u : [...u, data.url as string]));
      }
    } catch {
      setError("Ошибка загрузки файла");
    } finally {
      setUploadBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          token: token || undefined,
          authorName,
          body,
          rating,
          imageUrls: uploadedUrls,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось отправить.");
        return;
      }
      setUi("sent");
      setReviewState("pending");
    } catch {
      setError("Ошибка сети.");
    }
  };

  if (!orderId) {
    return (
      <p className="text-sm text-zinc-600">
        Нет данных заказа. Откройте страницу из раздела «История заказов» или по ссылке после доставки.
      </p>
    );
  }

  if (ui === "loading") {
    return <div className="h-32 animate-pulse rounded-2xl bg-white/40" />;
  }

  if (ui === "wait_delivery") {
    return (
      <div className="space-y-4">
        <p className="text-zinc-800">
          Отзыв можно оставить после доставки заказа{orderStatusLabelText ? ` (сейчас: ${orderStatusLabelText})` : ""}.
        </p>
        <p className="text-sm text-zinc-600">
          Мы обновим статус в личном кабинете. Если есть вопросы — напишите нам в{" "}
          <a href="https://t.me/porodacosmetics" target="_blank" rel="noopener noreferrer" className="font-medium underline">
            Telegram
          </a>
          .
        </p>
        <Link href="/account/orders" className="inline-block rounded-2xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
          К моим заказам
        </Link>
      </div>
    );
  }

  if (ui === "sent" && reviewState === "approved" && rewardCode) {
    return (
      <div className="space-y-4">
        <p className="text-zinc-800">Спасибо! Ваш отзыв опубликован.</p>
        <p className="text-sm text-zinc-600">
          Промокод на скидку 10% на следующий заказ:{" "}
          <span className="rounded-lg bg-zinc-900 px-3 py-1 font-mono text-sm font-semibold text-white">{rewardCode}</span>
        </p>
        <p className="text-xs text-zinc-500">Введите код в поле «Промокод» при оформлении. Одно использование.</p>
        <Link href="/catalog" className="inline-block rounded-2xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
          К каталогу
        </Link>
      </div>
    );
  }

  if (ui === "sent" && reviewState === "approved" && !rewardCode) {
    return (
      <p className="text-zinc-700">
        Отзыв одобрен. Если промокод не отображается, напишите в{" "}
        <Link href="/contacts" className="font-medium underline">
          контакты
        </Link>
        .
      </p>
    );
  }

  if (ui === "sent" && reviewState === "rejected") {
    return (
      <p className="text-zinc-700">
        К сожалению, этот отзыв не прошёл модерацию. Если нужна помощь —{" "}
        <Link href="/contacts" className="underline">
          свяжитесь с нами
        </Link>
        .
      </p>
    );
  }

  if (ui === "sent" && reviewState === "pending") {
    return (
      <div className="space-y-4">
        <p className="text-zinc-800">Спасибо! Отзыв отправлен на проверку.</p>
        <p className="text-sm text-zinc-600">
          После публикации вы сможете получить промокод 10% на следующий заказ. Обновите страницу позже.
        </p>
        <button
          type="button"
          onClick={() => refreshStatus()}
          className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-white/60"
        >
          Проверить статус
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <p className="text-lg font-medium text-zinc-900">Оставьте отзыв — нам будет очень приятно</p>
      <p className="text-sm text-zinc-600">
        После модерации отзыв появится в разделе «О нас — отзывы», вам будет начислен промокод 10% на следующий заказ
        (одно применение). Можно приложить до 6 фото.
      </p>
      <div>
        <label htmlFor="rev-name" className="block text-sm font-medium text-zinc-700">
          Имя для публикации
        </label>
        <input
          id="rev-name"
          required
          minLength={2}
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="liquid-input mt-1 w-full rounded-xl px-4 py-2.5"
          placeholder="Как подписать отзыв"
        />
      </div>
      <div>
        <span className="block text-sm font-medium text-zinc-700">Оценка</span>
        <div className="mt-2">
          <StarPicker value={rating} onChange={setRating} />
        </div>
      </div>
      <div>
        <label htmlFor="rev-body" className="block text-sm font-medium text-zinc-700">
          Текст отзыва
        </label>
        <textarea
          id="rev-body"
          required
          minLength={10}
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="liquid-input mt-1 w-full rounded-xl px-4 py-2.5"
          placeholder="Что понравилось, как пользовались, результат"
        />
      </div>
      <div>
        <span className="block text-sm font-medium text-zinc-700">Фото (необязательно)</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          disabled={uploadBusy || uploadedUrls.length >= 6}
          className="mt-2 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium"
          onChange={(e) => {
            const list = e.target.files;
            if (!list?.length) return;
            void (async () => {
              for (const file of Array.from(list).slice(0, 6)) {
                await uploadFile(file);
              }
              e.target.value = "";
            })();
          }}
        />
        {uploadedUrls.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {uploadedUrls.map((u) => (
              <li key={u} className="relative h-20 w-20 overflow-hidden rounded-lg border border-zinc-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  className="absolute right-0.5 top-0.5 rounded bg-black/60 px-1 text-xs text-white"
                  onClick={() => setUploadedUrls((prev) => prev.filter((x) => x !== u))}
                  aria-label="Убрать фото"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-xs text-zinc-500">Отзыв привязан к заказу: на сайте будет отмечено, что это мнение покупателя PORODA.</p>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button type="submit" className="rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800">
        Отправить на модерацию
      </button>
    </form>
  );
}
