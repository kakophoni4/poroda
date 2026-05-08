"use client";

import { useEffect, useState } from "react";

type DayPoint = { day: string; views: number; uniqueIp: number };

type StatsResponse = {
  periodDays: { d7: number; d30: number };
  summary7: { views: number; uniqueUsers: number; sessions: number };
  summary30: { views: number; uniqueUsers: number; sessions: number };
  byDay7: DayPoint[];
  byDay30: DayPoint[];
  meta: { hasIpHashOnPageView: boolean; hasIpDataIn7d: boolean };
};

function maxOf(nums: number[]) {
  if (nums.length === 0) return 0;
  return Math.max(0, ...nums);
}

function BarRow({
  label,
  data,
  valueKey,
  className = "bg-zinc-500",
}: {
  label: string;
  data: DayPoint[];
  valueKey: "views" | "uniqueIp";
  className?: string;
}) {
  const values = data.map((d) => d[valueKey]);
  const m = maxOf(values);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-zinc-600">
        <span>{label}</span>
        {m === 0 && <span className="text-xs text-zinc-400">нет данных</span>}
      </div>
      <div
        className="flex h-20 items-end gap-px sm:gap-0.5"
        style={{ minHeight: "4.5rem" }}
        role="img"
        aria-label={label}
      >
        {data.map((d) => {
          const h = m === 0 || d[valueKey] === 0 ? 0 : (d[valueKey] / m) * 100;
          const dayShort = d.day.slice(5);
          return (
            <div key={d.day} className="group flex min-w-0 flex-1 flex-col items-stretch" title={`${d.day}: ${d[valueKey]}`}>
              <div className="flex flex-1 flex-col justify-end">
                <div
                  className={`w-full rounded-t ${className} min-h-px transition-opacity group-hover:opacity-90`}
                  style={{ height: h === 0 ? "0%" : `${Math.max(2, h)}%` }}
                />
              </div>
              <div className="mt-0.5 truncate text-center text-[9px] leading-tight text-zinc-500 sm:text-[10px]">{dayShort}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const m = maxOf(values);
  if (values.length === 0) return <span className="text-sm text-zinc-400">—</span>;
  if (m === 0) {
    return <div className="flex h-8 w-full items-end justify-between gap-px">{(values as number[]).map((_, i) => (
      <div key={i} className="h-1 flex-1 rounded-sm bg-zinc-200" />
    ))}</div>;
  }
  const w = 100 / values.length;
  return (
    <svg className="h-10 w-full" viewBox="0 0 100 32" preserveAspectRatio="none" role="img" aria-hidden>
      <polyline
        fill="none"
        className={className ?? "stroke-zinc-600"}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        points={values
          .map((v, i) => {
            const x = (i + 0.5) * w;
            const y = 32 - (v / m) * 28 - 2;
            return `${x},${y}`;
          })
          .join(" ")}
      />
    </svg>
  );
}

export default function AdminStatsClient() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then((j: StatsResponse) => setData(j))
      .catch((e) => setErr(e instanceof Error ? e.message : "Ошибка загрузки"));
  }, []);

  if (err) return <p className="mt-6 text-sm text-red-600">Не удалось загрузить статистику: {err}</p>;
  if (!data) return <p className="mt-6 text-sm text-zinc-500">Загрузка…</p>;

  const s7v = data.byDay7.map((d) => d.views);
  const s30v = data.byDay30.map((d) => d.views);

  return (
    <div className="mt-6 space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 p-4">
          <h3 className="text-sm font-medium text-zinc-600">Просмотры, {data.periodDays.d7} дн. (UTC)</h3>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{data.summary7.views.toLocaleString("ru-RU")}</p>
          <p className="mt-1 text-xs text-zinc-500">COUNT(*) за период</p>
          <div className="mt-2">
            <Sparkline values={s7v} className="stroke-sky-600" />
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 p-4">
          <h3 className="text-sm font-medium text-zinc-600">Уникальные пользователи, {data.periodDays.d7} дн.</h3>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{data.summary7.uniqueUsers.toLocaleString("ru-RU")}</p>
          <p className="mt-1 text-xs text-zinc-500">COUNT(DISTINCT userId) при userId IS NOT NULL</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 p-4 sm:col-span-2 lg:col-span-1">
          <h3 className="text-sm font-medium text-zinc-600">Сессии (оценка по IP), {data.periodDays.d7} дн.</h3>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{data.summary7.sessions.toLocaleString("ru-RU")}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {data.meta.hasIpDataIn7d
              ? "Число пар (день UTC, ipHash) с непустым ipHash; один IP = одна сессия в сутки."
              : "Пока нет событий с ipHash (старые строки) — с новых визитов цифра наполнится."}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 p-4">
          <h3 className="text-sm font-medium text-zinc-600">Просмотры, {data.periodDays.d30} дн. (UTC)</h3>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{data.summary30.views.toLocaleString("ru-RU")}</p>
          <p className="mt-1 text-xs text-zinc-500">COUNT(*)</p>
          <div className="mt-2">
            <Sparkline values={s30v} className="stroke-amber-700" />
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 p-4">
          <h3 className="text-sm font-medium text-zinc-600">Уникальные пользователи, {data.periodDays.d30} дн.</h3>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{data.summary30.uniqueUsers.toLocaleString("ru-RU")}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 p-4 sm:col-span-2 lg:col-span-1">
          <h3 className="text-sm font-medium text-zinc-600">Сессии (оценка по IP), {data.periodDays.d30} дн.</h3>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{data.summary30.sessions.toLocaleString("ru-RU")}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-zinc-200 p-6">
          <h3 className="font-medium">По дням, последние 7 (UTC)</h3>
          <p className="mt-1 text-sm text-zinc-500">Столбцы: дневной объём — не каждый визит считается уникальным.</p>
          <div className="mt-6 space-y-8">
            <BarRow label="Просмотры в день (COUNT(*))" data={data.byDay7} valueKey="views" className="bg-sky-500" />
            {data.meta.hasIpHashOnPageView && (
              <BarRow
                label="Уник. IP в день (оценка уник. гостей)"
                data={data.byDay7}
                valueKey="uniqueIp"
                className="bg-amber-500/90"
              />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 p-6">
          <h3 className="font-medium">По дням, последние 30 (UTC)</h3>
          <div className="mt-6 space-y-8">
            <BarRow label="Просмотры в день" data={data.byDay30} valueKey="views" className="bg-sky-500" />
            {data.meta.hasIpHashOnPageView && (
              <BarRow
                label="Уник. IP в день"
                data={data.byDay30}
                valueKey="uniqueIp"
                className="bg-amber-500/90"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
