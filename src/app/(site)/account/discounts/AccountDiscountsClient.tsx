"use client";

import { useCallback, useEffect, useState } from "react";
import { accountCardClass } from "../account-ui";

type Item = {
  code: string;
  label: string;
  description: string | null;
  used: boolean;
  usedAt: string | null;
  orderId: string | null;
  validTo: string | null;
};

const cardMinHeight = "min-h-[152px]";

export default function AccountDiscountsClient() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/discounts");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось загрузить");
        setItems([]);
        return;
      }
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setError("Ошибка сети");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <>
        <h1 className="text-2xl font-semibold">Скидки и промокоды</h1>
        <div className={`${accountCardClass} mx-auto mt-6 h-48 max-w-md animate-pulse`} />
      </>
    );
  }

  const list = items ?? [];

  return (
    <>
      <h1 className="text-2xl font-semibold">Скидки и промокоды</h1>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mx-auto mt-8 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        {list.length === 0 ? (
          <div className={`${accountCardClass} ${cardMinHeight} sm:col-span-2`}>
            <p className="text-sm text-zinc-600">Пока нет промокодов для отображения.</p>
          </div>
        ) : (
          list.map((item) => {
            const key = item.used && item.orderId ? `${item.orderId}-${item.code}` : item.code;
            return (
              <div
                key={key}
                className={`${accountCardClass} ${cardMinHeight} relative flex flex-col justify-center overflow-hidden text-center`}
              >
                {item.used ? (
                  <>
                    <div
                      className="pointer-events-none absolute inset-0 z-0 opacity-[0.55]"
                      style={{
                        backgroundImage: `repeating-linear-gradient(
                          -36deg,
                          transparent,
                          transparent 5px,
                          rgb(161 161 170 / 0.22) 5px,
                          rgb(161 161 170 / 0.22) 10px
                        )`,
                      }}
                      aria-hidden
                    />
                    <div className="relative z-[1] flex min-h-0 flex-1 flex-col justify-center">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Использован</p>
                      <p className="mt-2 font-mono text-lg font-semibold text-zinc-800 line-through decoration-zinc-500">
                        {item.code}
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-600">{item.label}</p>
                      {item.description ? (
                        <p className="mt-2 line-clamp-2 text-xs text-zinc-500">{item.description}</p>
                      ) : null}
                      {item.usedAt ? (
                        <p className="mt-3 text-xs text-zinc-500">
                          {new Date(item.usedAt).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-0 flex-1 flex-col justify-center">
                    <p className="font-mono text-lg font-semibold text-zinc-900">{item.code}</p>
                    <p className="mt-2 text-sm font-medium text-zinc-800">{item.label}</p>
                    {item.description ? <p className="mt-2 line-clamp-3 text-xs text-zinc-600">{item.description}</p> : null}
                    {item.validTo ? (
                      <p className="mt-3 text-xs text-zinc-500">
                        до {new Date(item.validTo).toLocaleDateString("ru-RU")}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
