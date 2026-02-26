import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, setUserSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone } = body as { email: string; password: string; name?: string; phone?: string };
    if (!email?.trim() || !password || password.length < 6) {
      return NextResponse.json({ error: "Некорректный email или пароль (минимум 6 символов)" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "Пользователь с таким email уже зарегистрирован" }, { status: 400 });
    }
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        passwordHash,
        name: name?.trim() || null,
        phone: phone?.trim() || null,
      },
    });
    await setUserSession({ userId: user.id, email: user.email });
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json({ error: "Ошибка регистрации" }, { status: 500 });
  }
}
