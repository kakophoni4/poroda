import AdminHomeBannersClient from "./AdminHomeBannersClient";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const banners = await prisma.homePromoBanner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return (
    <>
      <h1 className="text-2xl font-semibold">Баннеры главной</h1>
      <p className="mt-1 text-sm text-zinc-600">Акции сверху главной страницы: фото, ссылка и оформление кнопки.</p>
      <AdminHomeBannersClient initial={banners} />
    </>
  );
}
