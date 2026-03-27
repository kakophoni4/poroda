import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, body: message } = body as {
      name?: string;
      email?: string;
      phone?: string;
      body?: string;
    };
    const n = name?.trim() ?? "";
    const msg = message?.trim() ?? "";
    if (n.length < 2 || msg.length < 10) {
      return NextResponse.json(
        { error: "Укажите имя и вопрос (не короче 10 символов)." },
        { status: 400 }
      );
    }
    if (msg.length > 8000) {
      return NextResponse.json({ error: "Текст слишком длинный." }, { status: 400 });
    }
    await prisma.siteQuestion.create({
      data: {
        name: n,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        body: msg,
        status: "new",
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("SiteQuestion POST:", e);
    return NextResponse.json({ error: "Не удалось отправить вопрос." }, { status: 500 });
  }
}
