import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

const WINDOW_SEC = 15 * 60;
const WINDOW_MS = WINDOW_SEC * 1000;
/** Неуспешных за 15 мин по (scope, identifier) не больше этого числа; следующая попытка — 429. */
const MAX_FAILED_PER_IDENTIFIER = 8;
/** Неуспешных за 15 мин по (scope, ipHash) не больше этого числа; следующая попытка — 429. */
const MAX_FAILED_PER_IP = 30;

const VERIFY_RESEND_WINDOW_MS = 60 * 60 * 1000; // 1 ч
const VERIFY_RESEND_MAX = 3;

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || "change-me-in-production";
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real?.trim()) return real.trim();
  return "unknown";
}

/** SHA-256 от (ip + SESSION_SECRET), без хранения сырого IP. */
export function hashIp(req: NextRequest): string {
  return createHash("sha256")
    .update(getClientIp(req) + getSessionSecret())
    .digest("hex");
}

export type AuthRateLimitScope =
  | "user_login"
  | "register"
  | "admin_login"
  | "password_reset"
  | "verify_resend"
  | "admin_mailing";

type CheckAuthRateLimitInput = {
  scope: AuthRateLimitScope;
  /** Нормализованный email или "anon" */
  identifier: string;
  request: NextRequest;
};

function retryAfterFromOldest(oldest: Date | null): number {
  if (!oldest) return WINDOW_SEC;
  const ageSec = Math.floor((Date.now() - oldest.getTime()) / 1000);
  return Math.max(1, WINDOW_SEC - ageSec);
}

/**
 * Считает только неуспешные попытки за 15 минут.
 * — по (scope, identifier): лимит 8;
 * — по (scope, ipHash): лимит 30.
 */
export async function checkAuthRateLimit(
  input: CheckAuthRateLimitInput
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const { scope, identifier, request } = input;
  if (scope === "admin_mailing") {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const count = await prisma.authAttempt.count({
      where: {
        scope: "admin_mailing",
        identifier: identifier,
        success: true,
        createdAt: { gte: since },
      },
    });
    if (count < 5) {
      return { allowed: true, retryAfterSec: 0 };
    }
    const oldest = await prisma.authAttempt.findFirst({
      where: { scope: "admin_mailing", identifier, success: true, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    const retryAfterSec = oldest
      ? Math.max(1, Math.ceil((60 * 60 * 1000 - (Date.now() - oldest.createdAt.getTime())) / 1000))
      : 3600;
    return { allowed: false, retryAfterSec };
  }
  if (scope === "verify_resend") {
    const since = new Date(Date.now() - VERIFY_RESEND_WINDOW_MS);
    const count = await prisma.authAttempt.count({
      where: {
        scope: "verify_resend",
        identifier,
        success: true,
        createdAt: { gte: since },
      },
    });
    if (count < VERIFY_RESEND_MAX) {
      return { allowed: true, retryAfterSec: 0 };
    }
    const oldest = await prisma.authAttempt.findFirst({
      where: { scope: "verify_resend", identifier, success: true, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    const retryAfterSec = oldest
      ? Math.max(
          1,
          Math.ceil(
            (VERIFY_RESEND_WINDOW_MS - (Date.now() - oldest.createdAt.getTime())) / 1000
          )
        )
      : 3600;
    return { allowed: false, retryAfterSec };
  }
  const ipHash = hashIp(request);
  const since = new Date(Date.now() - WINDOW_MS);

  const [idCount, ipCount] = await Promise.all([
    prisma.authAttempt.count({
      where: { scope, identifier, success: false, createdAt: { gte: since } },
    }),
    prisma.authAttempt.count({
      where: { scope, ipHash, success: false, createdAt: { gte: since } },
    }),
  ]);

  const overId = idCount >= MAX_FAILED_PER_IDENTIFIER;
  const overIp = ipCount >= MAX_FAILED_PER_IP;
  if (!overId && !overIp) {
    return { allowed: true, retryAfterSec: 0 };
  }

  const [oldestId, oldestIp] = await Promise.all([
    overId
      ? prisma.authAttempt.findFirst({
          where: { scope, identifier, success: false, createdAt: { gte: since } },
          orderBy: { createdAt: "asc" },
          select: { createdAt: true },
        })
      : null,
    overIp
      ? prisma.authAttempt.findFirst({
          where: { scope, ipHash, success: false, createdAt: { gte: since } },
          orderBy: { createdAt: "asc" },
          select: { createdAt: true },
        })
      : null,
  ]);

  const tId = overId ? retryAfterFromOldest(oldestId?.createdAt ?? null) : 0;
  const tIp = overIp ? retryAfterFromOldest(oldestIp?.createdAt ?? null) : 0;
  return { allowed: false, retryAfterSec: Math.max(tId, tIp) };
}

export type RecordAuthAttemptInput = {
  scope: AuthRateLimitScope;
  identifier: string;
  ipHash: string;
  success: boolean;
};

export async function recordAuthAttempt(input: RecordAuthAttemptInput): Promise<void> {
  const { scope, identifier, ipHash, success } = input;
  await prisma.authAttempt.create({
    data: { scope, identifier, ipHash, success },
  });
}

/** Удаляет все попытки с этим identifier в данном scope старше 24 ч (после успешного входа/регистрации). */
export async function pruneAuthAttemptsForIdentifier(
  scope: AuthRateLimitScope,
  identifier: string
): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await prisma.authAttempt.deleteMany({
    where: { scope, identifier, createdAt: { lt: cutoff } },
  });
}
