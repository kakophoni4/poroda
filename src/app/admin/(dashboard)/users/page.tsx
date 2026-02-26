import AdminUsersClient from "./AdminUsersClient";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, phone: true, createdAt: true, _count: { select: { orders: true } } },
  });
  const list = users.map((u) => ({ ...u, ordersCount: u._count.orders }));
  return (
    <>
      <h1 className="text-2xl font-semibold">Клиенты</h1>
      <p className="mt-1 text-sm text-zinc-600">Контакты и количество заказов.</p>
      <AdminUsersClient users={list} />
    </>
  );
}
