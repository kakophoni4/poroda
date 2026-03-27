import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function mintReviewPromoCode(orderId: string): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 40; attempt++) {
    let code = "RVW";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    const clash = await prisma.promo.findUnique({ where: { code } });
    if (!clash) {
      await prisma.promo.create({
        data: {
          code,
          percent: 10,
          maxUses: 1,
          usedCount: 0,
          active: true,
          description: `Скидка 10% за отзыв (заказ ${orderId.slice(0, 8)}…)`,
        },
      });
      return code;
    }
  }
  const code = `RVW${randomBytes(6).toString("hex").toUpperCase()}`;
  await prisma.promo.create({
    data: {
      code,
      percent: 10,
      maxUses: 1,
      usedCount: 0,
      active: true,
      description: `Скидка 10% за отзыв (заказ ${orderId.slice(0, 8)}…)`,
    },
  });
  return code;
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const body = await request.json();
  const action = body?.action as "approve" | "reject" | undefined;
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action: approve | reject" }, { status: 400 });
  }
  const review = await prisma.customerReview.findUnique({
    where: { id },
    include: { order: { select: { id: true, userId: true } } },
  });
  if (!review) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

  if (action === "reject") {
    await prisma.customerReview.update({
      where: { id },
      data: { status: "rejected" },
    });
    revalidatePath("/about/reviews");
    return NextResponse.json({ ok: true });
  }

  if (review.status === "approved" && review.rewardCode) {
    revalidatePath("/about/reviews");
    return NextResponse.json({ ok: true, rewardCode: review.rewardCode });
  }

  const code = await mintReviewPromoCode(review.order.id);
  await prisma.customerReview.update({
    where: { id },
    data: { status: "approved", rewardCode: code },
  });
  if (review.order.userId) {
    await prisma.userNotification.create({
      data: {
        userId: review.order.userId,
        title: "Отзыв опубликован",
        body: `Промокод на 10% на следующий заказ: ${code}`,
      },
    });
  }
  revalidatePath("/about/reviews");
  return NextResponse.json({ ok: true, rewardCode: code });
}
