import { prisma } from "@/lib/db";

const REVIEW_TITLE = "Оставьте отзыв";

export function buildOrderReviewUrl(reviewToken: string): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const base = raw.replace(/\/$/, "");
  if (!base) {
    console.warn("[review-invite] NEXT_PUBLIC_SITE_URL is not set, link may be invalid");
  }
  return `${base}/order/review?token=${encodeURIComponent(reviewToken)}`;
}

type OrderInviteFields = {
  id: string;
  userId: string | null;
  email: string;
  reviewToken: string | null;
};

/**
 * In-app review invite. UserNotification requires userId; guests without an account
 * are skipped (см. лог).
 */
export async function createReviewInviteNotification(
  order: OrderInviteFields,
  ctx: { reason: string }
): Promise<void> {
  const { reason } = ctx;
  if (!order.reviewToken) {
    console.log(`[review-invite] skip (${reason}): no reviewToken order=${order.id.slice(0, 8)}…`);
    return;
  }
  if (!order.userId) {
    const em = order.email?.trim() ?? "";
    if (em) {
      console.log(
        `[review-invite] skip (${reason}): no userId (гость, email задан) order=${order.id.slice(0, 8)}…`
      );
    } else {
      console.log(`[review-invite] skip (${reason}): no userId order=${order.id.slice(0, 8)}…`);
    }
    return;
  }
  const url = buildOrderReviewUrl(order.reviewToken);
  const body = `Оставьте отзыв о заказе. Ссылка: ${url}`;

  const dupe = await prisma.userNotification.findFirst({
    where: {
      userId: order.userId,
      title: REVIEW_TITLE,
      body: { contains: order.reviewToken },
    },
  });
  if (dupe) {
    console.log(
      `[review-invite] skip (${reason}): duplicate for user=${order.userId.slice(0, 8)}… order=${order.id.slice(0, 8)}…`
    );
    return;
  }

  await prisma.userNotification.create({
    data: {
      userId: order.userId,
      title: REVIEW_TITLE,
      body,
    },
  });
  console.log(
    `[review-invite] created (${reason}) userId=${order.userId.slice(0, 8)}… order=${order.id.slice(0, 8)}…`
  );
}
