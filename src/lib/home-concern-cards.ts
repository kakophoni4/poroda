import { prisma } from "@/lib/db";
import type { HomeConcernCardPublic } from "@/lib/home-concern-cards-public";

export type { HomeConcernCardPublic } from "@/lib/home-concern-cards-public";

/** Все карточки для админки (в т.ч. неактивные). Работает и при отсутствии делегата. */
export async function getHomeConcernCardsForAdmin(): Promise<
  { id: string; title: string; imageUrl: string; catalogQuery: string; sortOrder: number; active: boolean; createdAt: Date; updatedAt: Date }[]
> {
  const delegate = (prisma as { homeConcernCard?: { findMany: (args: unknown) => Promise<unknown[]> } }).homeConcernCard;
  if (delegate?.findMany) {
    try {
      const rows = await delegate.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      });
      return rows as { id: string; title: string; imageUrl: string; catalogQuery: string; sortOrder: number; active: boolean; createdAt: Date; updatedAt: Date }[];
    } catch {
      // fallback
    }
  }
  try {
    const rows = await prisma.$queryRaw<{ id: string; title: string; imageUrl: string; catalogQuery: string; sortOrder: number; active: boolean; createdAt: Date; updatedAt: Date }[]>`
      SELECT id, title, "imageUrl", "catalogQuery", "sortOrder", active, "createdAt", "updatedAt"
      FROM "HomeConcernCard"
      ORDER BY "sortOrder" ASC, "createdAt" DESC
    `;
    return rows ?? [];
  } catch {
    return [];
  }
}

export async function getActiveHomeConcernCards(): Promise<HomeConcernCardPublic[]> {
  const delegate = (prisma as { homeConcernCard?: { findMany: (args: unknown) => Promise<HomeConcernCardPublic[]> } }).homeConcernCard;
  if (delegate?.findMany) {
    try {
      const rows = await delegate.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, title: true, imageUrl: true, catalogQuery: true },
      });
      return rows;
    } catch {
      // fallback to raw
    }
  }
  try {
    const rows = await prisma.$queryRaw<HomeConcernCardPublic[]>`
      SELECT id, title, "imageUrl", "catalogQuery"
      FROM "HomeConcernCard"
      WHERE active = true
      ORDER BY "sortOrder" ASC
    `;
    return rows ?? [];
  } catch {
    return [];
  }
}
