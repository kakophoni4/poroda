import AdminPromosClient from "./AdminPromosClient";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPromosPage() {
  const promos = await prisma.promo.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <h1 className="text-2xl font-semibold">Скидки и промокоды</h1>
      <p className="mt-1 text-sm text-zinc-600">Создание промокодов, лимит использований, срок действия.</p>
      <AdminPromosClient initialPromos={promos} />
    </>
  );
}
