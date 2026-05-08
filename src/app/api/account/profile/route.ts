import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, phone: true, createdAt: true, marketingOptIn: true },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ user });
}

export async function PATCH(request: NextRequest) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const { name, phone, marketingOptIn } = body as {
      name?: string;
      phone?: string;
      marketingOptIn?: boolean;
    };
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...(name !== undefined && { name: name?.trim() || null }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(marketingOptIn !== undefined && { marketingOptIn: Boolean(marketingOptIn) }),
      },
      select: { id: true, email: true, name: true, phone: true, createdAt: true, marketingOptIn: true },
    });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Не удалось сохранить" }, { status: 500 });
  }
}
