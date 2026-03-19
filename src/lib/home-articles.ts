import { prisma } from "@/lib/db";

export type HomeArticlePublic = {
  id: string;
  title: string;
  linkUrl: string;
  description: string;
};

export async function getActiveHomeArticles(): Promise<HomeArticlePublic[]> {
  const delegate = (prisma as { homeArticle?: { findMany: (args: unknown) => Promise<unknown[]> } }).homeArticle;
  if (delegate?.findMany) {
    try {
      const rows = await delegate.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        select: { id: true, title: true, linkUrl: true, description: true },
      });
      return rows as HomeArticlePublic[];
    } catch {
      // fallback
    }
  }
  try {
    const rows = await prisma.$queryRaw<HomeArticlePublic[]>`
      SELECT id, title, "linkUrl", description FROM "HomeArticle"
      WHERE active = true ORDER BY "sortOrder" ASC, "createdAt" DESC
    `;
    return rows ?? [];
  } catch {
    return [];
  }
}

export async function getHomeArticlesForAdmin(): Promise<(HomeArticlePublic & { sortOrder: number; active: boolean })[]> {
  const delegate = (prisma as { homeArticle?: { findMany: (args: unknown) => Promise<unknown[]> } }).homeArticle;
  if (delegate?.findMany) {
    try {
      const rows = await delegate.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        select: { id: true, title: true, linkUrl: true, description: true, sortOrder: true, active: true },
      });
      return rows as (HomeArticlePublic & { sortOrder: number; active: boolean })[];
    } catch {
      // fallback
    }
  }
  try {
    const rows = await prisma.$queryRaw<(HomeArticlePublic & { sortOrder: number; active: boolean })[]>`
      SELECT id, title, "linkUrl", description, "sortOrder", active FROM "HomeArticle"
      ORDER BY "sortOrder" ASC, "createdAt" DESC
    `;
    return rows ?? [];
  } catch {
    return [];
  }
}
