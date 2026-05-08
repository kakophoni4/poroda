import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { validatePassword } from "@/lib/password-policy";
import { hashResetToken } from "@/lib/password-reset";

export async function POST(request: NextRequest) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  try {
    const body = await request.json() as { token?: string; newPassword?: string };
    const token = typeof body.token === "string" ? body.token : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!token) {
      return NextResponse.json({ error: "Нет токена" }, { status: 400 });
    }

    const passCheck = validatePassword(newPassword);
    if (!passCheck.ok) {
      return NextResponse.json({ error: passCheck.reason }, { status: 400 });
    }

    const tokenHash = hashResetToken(token);
    const existing = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
    const now = new Date();
    if (!existing || existing.usedAt != null || existing.expiresAt <= now) {
      return NextResponse.json(
        { error: "Ссылка недействительна или истекла" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: existing.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: existing.id },
        data: { usedAt: now },
      }),
      prisma.passwordResetToken.deleteMany({
        where: {
          userId: existing.userId,
          usedAt: null,
          id: { not: existing.id },
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Reset password error:", e);
    return NextResponse.json({ error: "Ошибка сброса пароля" }, { status: 500 });
  }
}
