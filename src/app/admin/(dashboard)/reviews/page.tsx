import type { Prisma } from "@prisma/client";
import AdminReviewsClient from "./AdminReviewsClient";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const reviewAdminInclude = {
  order: {
    select: { id: true, name: true, email: true, phone: true, total: true, createdAt: true },
  },
} as const;

export type AdminReviewRow = Prisma.CustomerReviewGetPayload<{ include: typeof reviewAdminInclude }>;

export default async function AdminReviewsPage() {
  let initial: AdminReviewRow[] = [];
  try {
    initial = await prisma.customerReview.findMany({
      orderBy: { createdAt: "desc" },
      include: reviewAdminInclude,
    });
  } catch {
    // нет БД
  }
  return (
    <>
      <h1 className="text-2xl font-semibold">Отзывы покупателей</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Новые отзывы приходят после заказа. Одобрите текст — он появится на странице «О нас — отзывы», клиенту будет
        создан промокод 10% (одно использование).
      </p>
      <AdminReviewsClient initial={initial} />
    </>
  );
}
