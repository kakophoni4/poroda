import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { hashVerificationToken } from "@/lib/email-verification";

function redirectInvalid(request: NextRequest) {
  const url = new URL("/account?verified=0&error=expired", request.nextUrl);
  return NextResponse.redirect(url);
}

type VerifyState = "success" | "expired" | "invalid";

function resolveState(
  row: { expiresAt: Date; usedAt: Date | null } | null,
  now: Date
): VerifyState {
  if (!row) return "invalid";
  if (row.usedAt != null) return "invalid";
  if (row.expiresAt <= now) return "expired";
  return "success";
}

/**
 * Старые письма: прямой GET ?token= → редирект в кабинет
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token || !token.trim()) {
    return redirectInvalid(request);
  }
  const tokenHash = hashVerificationToken(token);
  const existing = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
  });
  const now = new Date();
  if (!existing || existing.usedAt != null || existing.expiresAt <= now) {
    return redirectInvalid(request);
  }
  const okUrl = new URL("/account?verified=1", request.nextUrl);
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: existing.userId },
        data: { emailVerifiedAt: now },
      }),
      prisma.emailVerificationToken.update({
        where: { id: existing.id },
        data: { usedAt: now },
      }),
    ]);
  } catch (e) {
    console.error("verify-email error:", e);
    return redirectInvalid(request);
  }
  return NextResponse.redirect(okUrl);
}

/**
 * Новая страница /verify-email/[token]: JSON со статусом
 */
export async function POST(request: NextRequest) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, status: "invalid" as const }, { status: 400 });
  }
  const token = typeof (body as { token?: unknown }).token === "string" ? (body as { token: string }).token.trim() : "";
  if (!token) {
    return NextResponse.json({ ok: false, status: "invalid" as const, msg: "Нет токена" });
  }
  const tokenHash = hashVerificationToken(token);
  const existing = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
  });
  const now = new Date();
  const state = resolveState(existing, now);
  if (state !== "success") {
    return NextResponse.json({ ok: false, status: state });
  }
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: existing!.userId },
        data: { emailVerifiedAt: now },
      }),
      prisma.emailVerificationToken.update({
        where: { id: existing!.id },
        data: { usedAt: now },
      }),
    ]);
  } catch (e) {
    console.error("verify-email POST error:", e);
    return NextResponse.json({ ok: false, status: "invalid" as const });
  }
  return NextResponse.json({ ok: true, status: "success" as const });
}
