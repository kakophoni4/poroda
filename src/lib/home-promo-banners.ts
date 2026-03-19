import { prisma } from "@/lib/db";

export type HomeBannerPublic = {
  id: string;
  imageUrl: string;
  linkUrl: string;
  buttonText: string;
  buttonColor: string;
};

export async function getActiveHomePromoBanners(): Promise<HomeBannerPublic[]> {
  try {
    const rows = await prisma.homePromoBanner.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        imageUrl: true,
        linkUrl: true,
        buttonText: true,
        buttonColor: true,
      },
    });
    return rows;
  } catch {
    return [];
  }
}
