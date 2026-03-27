import { prisma } from "@/lib/db";

export async function findOrderForReviewAccess(
  orderId: string,
  opts: { token?: string | null; userId?: string | null }
) {
  const id = orderId.trim();
  if (!id) return null;
  const t = opts.token?.trim();
  if (t) {
    return prisma.order.findFirst({ where: { id, reviewToken: t } });
  }
  const uid = opts.userId?.trim();
  if (uid) {
    return prisma.order.findFirst({ where: { id, userId: uid } });
  }
  return null;
}
