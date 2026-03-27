"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CHECKOUT_WHEEL_SEGMENTS,
  CHECKOUT_WHEEL_SEGMENT_COUNT,
  wheelRotationForSegment,
} from "@/lib/checkout-wheel";

const COLORS = ["#fce7f3", "#ddd6fe", "#e0e7ff", "#cffafe", "#d1fae5", "#fef3c7", "#fecaca"];

function slicePath(i: number, cx: number, cy: number, r: number, n: number): string {
  const a0 = (i / n) * 2 * Math.PI - Math.PI / 2;
  const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
}

/** Поворот SVG: строка вдоль радиуса «от центра к краю», буквы остаются читаемыми */
function radialOutwardRotationDeg(tx: number, ty: number, cx: number, cy: number): number {
  let deg = (Math.atan2(ty - cy, tx - cx) * 180) / Math.PI;
  if (deg > 90 || deg < -90) deg += 180;
  return deg;
}

type SpinResult = {
  code: string;
  segmentIndex: number;
  label: string;
  isTelegramPrize: boolean;
  validUntil: string;
  hint: string;
};

type Props = {
  email: string;
  phone: string;
  onCode: (code: string) => void;
  disabled?: boolean;
};

export default function CheckoutSpinWheel({ email, phone, onCode, disabled }: Props) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const spinEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (spinEndTimer.current) clearTimeout(spinEndTimer.current);
    };
  }, []);

  const canTry = useMemo(() => {
    const e = email.trim();
    const d = phone.replace(/\D/g, "");
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && d.length >= 10;
  }, [email, phone]);

  const spin = useCallback(async () => {
    if (!canTry || spinning || disabled) return;
    setError(null);
    setResult(null);
    setSpinning(true);
    try {
      const res = await fetch("/api/checkout/wheel-spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось прокрутить.");
        setSpinning(false);
        return;
      }
      const segmentIndex = data.segmentIndex as number;
      const delta = wheelRotationForSegment(segmentIndex, 5);
      setRotation((r) => r + delta);
      if (spinEndTimer.current) clearTimeout(spinEndTimer.current);
      spinEndTimer.current = setTimeout(() => {
        spinEndTimer.current = null;
        setResult({
          code: data.code,
          segmentIndex,
          label: data.label,
          isTelegramPrize: !!data.isTelegramPrize,
          validUntil: data.validUntil,
          hint: data.hint,
        });
        onCode(data.code);
        setSpinning(false);
      }, 4200);
    } catch {
      setError("Ошибка сети.");
      setSpinning(false);
    }
  }, [canTry, spinning, disabled, email, phone, onCode]);

  const cx = 100;
  const cy = 100;
  const r = 92;
  const n = CHECKOUT_WHEEL_SEGMENT_COUNT;

  return (
    <div className="liquidGlass-dock rounded-3xl border border-white/40 p-5 sm:p-6">
      <h3 className="text-sm font-semibold text-zinc-900">Колесо удачи</h3>
      <p className="mt-1 text-xs text-zinc-600">
        После ввода email и телефона крутите колесо: суммы 200–300 ₽, скидки 5–15% или JACKPOT (каждый 50-й спин по
        счётчику сайта). Промокод создаётся автоматически.
      </p>

      <div className="relative mx-auto mt-4 w-[200px]">
        <div
          className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1"
          aria-hidden
        >
          <div className="h-0 w-0 border-x-[10px] border-x-transparent border-t-[14px] border-t-zinc-900 drop-shadow-sm" />
        </div>
        <div
          className="overflow-hidden rounded-full shadow-inner ring-2 ring-white/60"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 4s cubic-bezier(0.15, 0.85, 0.2, 1)" : "none",
          }}
        >
          <svg width="200" height="200" viewBox="0 0 200 200" className="block">
            <title>Колесо с призами</title>
            {CHECKOUT_WHEEL_SEGMENTS.map((seg, i) => (
              <path key={seg.index} d={slicePath(i, cx, cy, r, n)} fill={COLORS[i % COLORS.length]} stroke="white" strokeWidth="1" />
            ))}
            {CHECKOUT_WHEEL_SEGMENTS.map((seg, i) => {
              const mid = ((i + 0.5) / n) * 2 * Math.PI - Math.PI / 2;
              const line = (seg.wheelLines as readonly string[])[0];
              const fs = seg.index >= 3 && seg.index <= 5 ? 10 : seg.index === 6 ? 9 : 8.5;
              const trMid = 56;
              const cos = Math.cos(mid);
              const sin = Math.sin(mid);
              const tx = cx + trMid * cos;
              const ty = cy + trMid * sin;
              const rot = radialOutwardRotationDeg(tx, ty, cx, cy);
              return (
                <text
                  key={`wtxt-${seg.index}`}
                  x={tx}
                  y={ty}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#18181b"
                  fontSize={fs}
                  fontWeight="700"
                  transform={`rotate(${rot} ${tx} ${ty})`}
                  style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
                >
                  {line}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      <button
        type="button"
        disabled={!canTry || spinning || disabled || !!result}
        onClick={spin}
        className="mt-4 w-full rounded-2xl bg-gradient-to-r from-pink-600 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {spinning ? "Крутится…" : result ? "Уже выпал приз" : "Крутить колесо"}
      </button>

      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

      {result && (
        <div className="mt-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 text-sm">
          <p className="font-semibold text-zinc-900">Ваш приз: {result.label}</p>
          <p className="mt-2 font-mono text-base font-bold tracking-wide text-zinc-900">{result.code}</p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-700">{result.hint}</p>
          <p className="mt-2 text-xs text-zinc-500">
            Действует до: {new Date(result.validUntil).toLocaleString("ru-RU")}
          </p>
          {result.isTelegramPrize && (
            <a
              href="https://t.me/porodacosmetics"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800"
            >
              Написать в Telegram
            </a>
          )}
        </div>
      )}
    </div>
  );
}
