import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, setUserSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body as { email: string; password: string };
    if (!email?.trim() || !password) {
      return NextResponse.json({ error: "Введите email и пароль" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
    }
    await setUserSession({ userId: user.id, email: user.email });
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Ошибка входа" }, { status: 500 });
  }
}
