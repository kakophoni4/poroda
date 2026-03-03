import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, productId, userId } = body as { path?: string; productId?: string; userId?: string };
    if (!path) return NextResponse.json({ ok: false }, { status: 400 });

    let safeProductId: string | null = null;
    if (productId) {
      const exists = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
      if (exists) safeProductId = productId;
    }

    await prisma.pageView.create({
      data: {
        path: path.slice(0, 500),
        productId: safeProductId,
        userId: userId || null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.warn("PageView (запись пропущена):", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: true });
  }
}
