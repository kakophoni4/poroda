import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { findOrderForReviewAccess, getOrderReviewIneligibilityMessage } from "@/lib/review-order-access";
import { createReviewRewardForOrder } from "@/lib/review-reward";

/** Опубликованные отзывы для страницы «О нас — отзывы» */
export async function GET() {
  try {
    const rows = await prisma.customerReview.findMany({
      where: { status: "approved" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        authorName: true,
        body: true,
        rating: true,
        imageUrls: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ reviews: rows });
  } catch {
    return NextResponse.json({ reviews: [] });
  }
}

const MAX_IMAGES = 6;

/** Отправка отзыва: orderId + reviewToken ИЛИ владелец заказа в сессии; только после статуса «доставлен» */
export async function POST(request: NextRequest) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  try {
    const body = await request.json();
    const { orderId, token, authorName, body: text, rating, imageUrls } = body as {
      orderId?: string;
      token?: string;
      authorName?: string;
      body?: string;
      rating?: number;
      imageUrls?: string[];
    };
    const session = await getUserSession();
    const order = await findOrderForReviewAccess(orderId ?? "", {
      token: token ?? null,
      userId: session?.userId,
    });
    if (!order) {
      return NextResponse.json(
        { error: "Заказ не найден, ссылка недействительна или войдите в аккаунт, с которым оформляли заказ." },
        { status: 404 }
      );
    }
    const payBlock = getOrderReviewIneligibilityMessage(order);
    if (payBlock) {
      return NextResponse.json({ error: payBlock }, { status: 400 });
    }
    const name = authorName?.trim() ?? "";
    const reviewBody = text?.trim() ?? "";
    const r = typeof rating === "number" ? Math.min(5, Math.max(1, Math.round(rating))) : 5;
    if (name.length < 2 || reviewBody.length < 10) {
      return NextResponse.json(
        { error: "Имя (от 2 символов) и текст отзыва (от 10 символов)." },
        { status: 400 }
      );
    }
    if (reviewBody.length > 4000) {
      return NextResponse.json({ error: "Текст отзыва слишком длинный." }, { status: 400 });
    }
    let urls: string[] = [];
    if (Array.isArray(imageUrls)) {
      urls = imageUrls
        .filter((u): u is string => typeof u === "string")
        .map((u) => u.trim())
        .filter((u) => u.startsWith("/uploads/reviews/"))
        .slice(0, MAX_IMAGES);
    }
    const existing = await prisma.customerReview.findUnique({ where: { orderId: order.id } });
    if (existing) {
      return NextResponse.json({ error: "По этому заказу отзыв уже отправлен." }, { status: 409 });
    }
    try {
      const rewardCode = await prisma.$transaction(async (tx) => {
        const { code } = await createReviewRewardForOrder(order.id, order.userId ?? null, tx);
        await tx.customerReview.create({
          data: {
            orderId: order.id,
            authorName: name,
            body: reviewBody,
            rating: r,
            imageUrls: urls,
            status: "pending",
            rewardCode: code,
          },
        });
        return code;
      });
      return NextResponse.json({ ok: true, rewardCode });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return NextResponse.json({ error: "По этому заказу отзыв уже отправлен." }, { status: 409 });
      }
      throw e;
    }
  } catch (e) {
    console.error("Review POST:", e);
    return NextResponse.json({ error: "Не удалось сохранить отзыв." }, { status: 500 });
  }
}
