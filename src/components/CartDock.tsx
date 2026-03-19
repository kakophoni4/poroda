"use client";

import { useEffect, useLayoutEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

const MAX_LINE_TITLE_IN_DOCK = 52;
/** Fallback, если transitionend не пришёл (редкие браузеры / reduced motion) */
const CART_UNMOUNT_FALLBACK_MS = 520;

/** Плавающая кнопка корзины + модальное окно по центру экрана */
export default function CartDock() {
  const { lines, totalQuantity, subtotal, setQuantity, removeProduct, hydrated } = useCart();
  const [open, setOpen] = useState(false);
  /** Панель в DOM для анимации закрытия */
  const [panelMounted, setPanelMounted] = useState(false);
  /** Видимость (opacity / transform) */
  const [panelVisible, setPanelVisible] = useState(false);
  const [dockTop, setDockTop] = useState(96);
  /** Явно number: в DOM setTimeout возвращает number; с @types/node глобальный Timeout конфликтует при сборке */
  const closeFallbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const measure = () => {
      const el = document.getElementById("site-header-root");
      if (el) setDockTop(Math.max(8, el.getBoundingClientRect().bottom + 8));
      else setDockTop(96);
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    const el = document.getElementById("site-header-root");
    const ro = el ? new ResizeObserver(measure) : null;
    if (el && ro) ro.observe(el);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, []);

  useLayoutEffect(() => {
    if (open) setPanelMounted(true);
  }, [open]);

  useEffect(() => {
    if (open) {
      if (closeFallbackTimerRef.current) {
        window.clearTimeout(closeFallbackTimerRef.current);
        closeFallbackTimerRef.current = null;
      }
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setPanelVisible(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        if (inner) cancelAnimationFrame(inner);
      };
    }
    /* Два кадра перед стартом «уезда» — браузер успевает зафиксировать открытое состояние, transition отрабатывает плавно */
    let innerClose = 0;
    const outerClose = requestAnimationFrame(() => {
      innerClose = requestAnimationFrame(() => setPanelVisible(false));
    });
    closeFallbackTimerRef.current = window.setTimeout(() => {
      closeFallbackTimerRef.current = null;
      setPanelMounted(false);
    }, CART_UNMOUNT_FALLBACK_MS);
    return () => {
      cancelAnimationFrame(outerClose);
      if (innerClose) cancelAnimationFrame(innerClose);
      if (closeFallbackTimerRef.current) {
        window.clearTimeout(closeFallbackTimerRef.current);
        closeFallbackTimerRef.current = null;
      }
    };
  }, [open]);

  useEffect(() => {
    if (!panelMounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [panelMounted]);

  useEffect(() => {
    if (!panelMounted || !panelVisible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelMounted, panelVisible]);

  const close = useCallback(() => setOpen(false), []);

  const finishCloseUnmount = useCallback(() => {
    if (closeFallbackTimerRef.current) {
      window.clearTimeout(closeFallbackTimerRef.current);
      closeFallbackTimerRef.current = null;
    }
    setPanelMounted(false);
  }, []);

  const onPanelTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return;
      if (e.propertyName !== "opacity") return;
      if (open) return;
      finishCloseUnmount();
    },
    [open, finishCloseUnmount]
  );

  /* duration-[400ms] — и панель, и затемнение; без filter в transition (glass меньше «дёргается» при закрытии) */
  const panelTransitionClass =
    "transition-[opacity,transform] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-opacity motion-reduce:duration-200";
  const backdropTransitionClass =
    "transition-[opacity,backdrop-filter] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

  return (
    <>
      <div
        className="pointer-events-none fixed right-2 z-[48] flex flex-col items-end sm:right-4"
        style={{ top: dockTop }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="glass-subtle pointer-events-auto flex flex-col items-center gap-0.5 rounded-2xl border border-white/45 px-3 py-2.5 text-zinc-900 shadow-md transition-[transform,background-color,box-shadow] duration-200 ease-out hover:bg-white/45 active:scale-[0.98]"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={totalQuantity > 0 ? `Корзина, ${totalQuantity} шт.` : "Корзина"}
        >
          <span className="relative inline-flex">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.25 0H4.5l-.75 6.75h16.5l-.75-6.75z"
              />
            </svg>
            {hydrated && totalQuantity > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-zinc-900 px-1 text-[10px] font-bold text-white transition-transform duration-200">
                {totalQuantity > 99 ? "99+" : totalQuantity}
              </span>
            )}
          </span>
          {hydrated && totalQuantity > 0 && (
            <span className="max-w-[5.5rem] truncate text-center text-[10px] font-semibold tabular-nums text-zinc-700">
              {subtotal.toLocaleString("ru-RU")} ₽
            </span>
          )}
          <span className="text-[10px] font-medium text-zinc-500">Корзина</span>
        </button>
      </div>

      {panelMounted && (
        <>
          <button
            type="button"
            className={`fixed inset-0 z-[200] bg-black/35 ${backdropTransitionClass} ${
              panelVisible
                ? "opacity-100 backdrop-blur-[2px]"
                : "pointer-events-none opacity-0 backdrop-blur-none"
            }`}
            aria-label="Закрыть корзину"
            onClick={close}
          />
          <div
            className="pointer-events-none fixed inset-0 z-[210] flex items-center justify-center p-4 sm:p-6"
            role="presentation"
          >
            <div
              className={`glass-card pointer-events-auto flex max-h-[min(85dvh,32rem)] w-[min(100%,28rem)] max-w-md flex-col overflow-hidden rounded-3xl border border-white/50 shadow-2xl ${panelTransitionClass} ${
                panelVisible
                  ? "translate-y-0 scale-100 opacity-100 motion-reduce:translate-y-0 motion-reduce:scale-100"
                  : "pointer-events-none translate-y-3 scale-[0.97] opacity-0 motion-reduce:translate-y-0 motion-reduce:scale-100"
              }`}
              role="dialog"
              aria-modal="true"
              aria-hidden={!panelVisible}
              aria-labelledby="cart-dock-title"
              onTransitionEnd={onPanelTransitionEnd}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-white/40 px-4 py-3">
                <h2 id="cart-dock-title" className="text-lg font-semibold text-zinc-900">
                  Корзина
                </h2>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-xl p-2 text-zinc-600 transition-[background-color,color,transform] duration-200 ease-out hover:bg-white/40 hover:text-zinc-900 active:scale-95"
                  aria-label="Закрыть"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Стабильная минимальная высота — меньше скачка при появлении контента после гидратации */}
              <div className="min-h-[min(12rem,40dvh)] min-w-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 transition-opacity duration-200">
                {!hydrated ? (
                  <div className="space-y-3" aria-busy="true">
                    <div className="h-4 w-2/3 animate-pulse rounded-lg bg-zinc-200/60" />
                    <div className="h-20 animate-pulse rounded-2xl bg-zinc-200/40" />
                    <div className="h-20 animate-pulse rounded-2xl bg-zinc-200/40" />
                  </div>
                ) : lines.length === 0 ? (
                  <p className="text-sm text-zinc-600">Пока пусто. Добавьте позиции из каталога или с главной.</p>
                ) : (
                  <ul className="space-y-3">
                    {lines.map((line) => (
                      <li
                        key={line.productId}
                        className="glass-subtle rounded-2xl border border-white/45 p-3 text-sm transition-shadow duration-200"
                      >
                        <div className="flex gap-2">
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/catalog/${line.slug}`}
                              className="font-medium text-zinc-900 transition-colors duration-150 hover:underline"
                              onClick={close}
                            >
                              {line.title.length > MAX_LINE_TITLE_IN_DOCK
                                ? `${line.title.slice(0, MAX_LINE_TITLE_IN_DOCK)}…`
                                : line.title}
                            </Link>
                            <p className="mt-1 text-xs tabular-nums text-zinc-600">
                              {line.price.toLocaleString("ru-RU")} ₽ за шт. ·{" "}
                              <span className="font-medium text-zinc-800">
                                {(line.price * line.quantity).toLocaleString("ru-RU")} ₽
                              </span>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeProduct(line.productId)}
                            className="shrink-0 self-start rounded-lg px-2 py-1 text-[11px] text-zinc-500 transition-colors duration-150 hover:bg-red-500/10 hover:text-red-700"
                            title="Удалить позицию"
                          >
                            Удалить
                          </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/35 pt-3">
                          <span className="text-xs font-medium text-zinc-600">Количество</span>
                          <div className="glass-subtle flex items-center gap-1 rounded-xl border border-white/45 p-0.5">
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-medium text-zinc-800 transition-[background-color,transform] duration-150 ease-out hover:bg-white/45 active:scale-95"
                              aria-label="Уменьшить количество"
                              onClick={() => setQuantity(line.productId, line.quantity - 1)}
                            >
                              −
                            </button>
                            <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums text-zinc-900">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-medium text-zinc-800 transition-[background-color,transform] duration-150 ease-out hover:bg-white/45 active:scale-95 disabled:opacity-40"
                              aria-label="Увеличить количество"
                              disabled={line.quantity >= 99}
                              onClick={() => setQuantity(line.productId, line.quantity + 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {hydrated && lines.length > 0 && (
                <div className="shrink-0 border-t border-white/40 px-4 py-4 transition-opacity duration-200">
                  <p className="flex justify-between text-sm font-medium text-zinc-800">
                    <span>Итого</span>
                    <span className="tabular-nums">{subtotal.toLocaleString("ru-RU")} ₽</span>
                  </p>
                  <Link
                    href="/checkout"
                    onClick={close}
                    className="mt-3 flex w-full items-center justify-center rounded-2xl bg-zinc-900 py-3 text-sm font-semibold text-white shadow-md transition-[background-color,transform,box-shadow] duration-200 ease-out hover:bg-zinc-800 active:scale-[0.99]"
                  >
                    Оформить заказ
                  </Link>
                  <Link
                    href="/catalog"
                    onClick={close}
                    className="mt-2 block text-center text-sm text-zinc-600 transition-colors duration-150 hover:text-zinc-900"
                  >
                    Продолжить выбор
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
