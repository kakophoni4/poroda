import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Старт календарного дня в UTC, отсчитанный (n−1) дней назад от сегодня 00:00 UTC —
 * диапазон n календарных дней, включая «сегодня».
 */
function startOfUtcNDaysAgo(n: number) {
  const t = new Date();
  t.setUTCHours(0, 0, 0, 0);
  t.setUTCDate(t.getUTCDate() - (n - 1));
  return t;
}

function endOfTodayUtc() {
  const t = new Date();
  t.setUTCHours(0, 0, 0, 0);
  return t;
}

function toIsoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Все календарные дни [inclusiveFrom, inclusiveTo] в UTC. */
function listUtcCalendarDays(inclusiveFrom: Date, inclusiveTo: Date) {
  const from = new Date(inclusiveFrom);
  from.setUTCHours(0, 0, 0, 0);
  const to = new Date(inclusiveTo);
  to.setUTCHours(0, 0, 0, 0);
  const out: string[] = [];
  const cur = new Date(from);
  while (cur <= to) {
    out.push(toIsoDay(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

function num(v: bigint | null | undefined) {
  if (v == null) return 0;
  return Number(v);
}

type DayCount = { d: string; c: bigint };

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const since7 = startOfUtcNDaysAgo(7);
  const since30 = startOfUtcNDaysAgo(30);
  const endDay = endOfTodayUtc();

  const [views7, views30, u7, u30, sess7, sess30, dayRows7, dayRows30, ipDay7, ipDay30, anyIpIn7] = await Promise.all([
    prisma.pageView.count({ where: { createdAt: { gte: since7 } } }),
    prisma.pageView.count({ where: { createdAt: { gte: since30 } } }),
    prisma.$queryRaw<{ c: bigint }[]>`SELECT COUNT(DISTINCT "userId")::bigint AS c FROM "PageView"
      WHERE "userId" IS NOT NULL AND "createdAt" >= ${since7}`,
    prisma.$queryRaw<{ c: bigint }[]>`SELECT COUNT(DISTINCT "userId")::bigint AS c FROM "PageView"
      WHERE "userId" IS NOT NULL AND "createdAt" >= ${since30}`,
    prisma.$queryRaw<{ c: bigint }[]>`SELECT COUNT(*)::bigint AS c FROM (
      SELECT DISTINCT
        (("p"."createdAt" AT TIME ZONE 'UTC')::date) AS d,
        p."ipHash" AS h
      FROM "PageView" p
      WHERE p."ipHash" IS NOT NULL
        AND p."createdAt" >= ${since7}
    ) t`,
    prisma.$queryRaw<{ c: bigint }[]>`SELECT COUNT(*)::bigint AS c FROM (
      SELECT DISTINCT
        (("p"."createdAt" AT TIME ZONE 'UTC')::date) AS d,
        p."ipHash" AS h
      FROM "PageView" p
      WHERE p."ipHash" IS NOT NULL
        AND p."createdAt" >= ${since30}
    ) t`,
    prisma.$queryRaw<DayCount[]>`SELECT
        (("createdAt" AT TIME ZONE 'UTC')::date)::text AS d,
        COUNT(*)::bigint AS c
      FROM "PageView"
      WHERE "createdAt" >= ${since7}
      GROUP BY 1
      ORDER BY 1`,
    prisma.$queryRaw<DayCount[]>`SELECT
        (("createdAt" AT TIME ZONE 'UTC')::date)::text AS d,
        COUNT(*)::bigint AS c
      FROM "PageView"
      WHERE "createdAt" >= ${since30}
      GROUP BY 1
      ORDER BY 1`,
    prisma.$queryRaw<DayCount[]>`SELECT
        (("createdAt" AT TIME ZONE 'UTC')::date)::text AS d,
        (COUNT(DISTINCT "ipHash")::bigint) AS c
      FROM "PageView"
      WHERE "ipHash" IS NOT NULL
        AND "createdAt" >= ${since7}
      GROUP BY 1
      ORDER BY 1`,
    prisma.$queryRaw<DayCount[]>`SELECT
        (("createdAt" AT TIME ZONE 'UTC')::date)::text AS d,
        (COUNT(DISTINCT "ipHash")::bigint) AS c
      FROM "PageView"
      WHERE "ipHash" IS NOT NULL
        AND "createdAt" >= ${since30}
      GROUP BY 1
      ORDER BY 1`,
    prisma.$queryRaw<{ c: bigint }[]>`SELECT COUNT(*)::bigint AS c FROM "PageView"
      WHERE "ipHash" IS NOT NULL AND "createdAt" >= ${since7}`,
  ]);

  const byDayMap = (rows: DayCount[]) =>
    Object.fromEntries(rows.map((r) => [r.d, num(r.c)])) as Record<string, number>;

  const d7 = listUtcCalendarDays(since7, endDay);
  const d30 = listUtcCalendarDays(since30, endDay);
  const map7 = byDayMap(dayRows7);
  const map30 = byDayMap(dayRows30);
  const mapIp7 = byDayMap(ipDay7);
  const mapIp30 = byDayMap(ipDay30);

  const byDay7 = d7.map((day) => ({
    day,
    views: map7[day] ?? 0,
    uniqueIp: mapIp7[day] ?? 0,
  }));
  const byDay30 = d30.map((day) => ({
    day,
    views: map30[day] ?? 0,
    uniqueIp: mapIp30[day] ?? 0,
  }));

  return NextResponse.json({
    periodDays: { d7: 7, d30: 30 },
    summary7: {
      views: views7,
      uniqueUsers: num(u7[0]!.c),
      sessions: num(sess7[0]!.c),
    },
    summary30: {
      views: views30,
      uniqueUsers: num(u30[0]!.c),
      sessions: num(sess30[0]!.c),
    },
    byDay7,
    byDay30,
    meta: { hasIpHashOnPageView: true, hasIpDataIn7d: num(anyIpIn7[0]!.c) > 0 },
  });
}
