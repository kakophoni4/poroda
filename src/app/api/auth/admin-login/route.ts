import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, setAdminSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body as { email: string; password: string };
    if (!email?.trim() || !password) {
      return NextResponse.json({ error: "Введите email и пароль" }, { status: 400 });
    }
    const admin = await prisma.admin.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
      return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }
    await setAdminSession({ adminId: admin.id, email: admin.email });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Admin login error:", e);
    return NextResponse.json({ error: "Ошибка входа" }, { status: 500 });
  }
}
