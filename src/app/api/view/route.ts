import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, productId, userId } = body as { path?: string; productId?: string; userId?: string };
    if (!path) return NextResponse.json({ ok: false }, { status: 400 });
    await prisma.pageView.create({
      data: {
        path: path.slice(0, 500),
        productId: productId || null,
        userId: userId || null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PageView error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
