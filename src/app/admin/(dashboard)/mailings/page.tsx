import AdminMailingsClient from "./AdminMailingsClient";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminMailingsPage() {
  const mailings = await prisma.mailing.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <h1 className="text-2xl font-semibold">Рассылки</h1>
      <p className="mt-1 text-sm text-zinc-600">Отправка уведомлений в личные кабинеты пользователей.</p>
      <AdminMailingsClient initialMailings={mailings} />
    </>
  );
}
