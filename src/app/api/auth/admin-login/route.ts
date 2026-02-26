import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, setAdminSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    console.error("Admin login: DATABASE_URL is not set");
    return NextResponse.json(
      { error: "Сервер не настроен: отсутствует DATABASE_URL" },
      { status: 503 }
    );
  }
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
    const err = e as Error;
    console.error("Admin login error:", err?.name, err?.message, err);
    const isDbError =
      err?.message?.includes("connect") ||
      err?.message?.includes("ECONNREFUSED") ||
      err?.message?.includes("Prisma") ||
      err?.message?.includes("connection");
    return NextResponse.json(
      { error: isDbError ? "Ошибка подключения к базе данных" : "Ошибка входа" },
      { status: 500 }
    );
  }
}
