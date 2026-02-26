import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, phone: true, createdAt: true, _count: { select: { orders: true } } },
  });
  return NextResponse.json(users.map((u) => ({ ...u, ordersCount: u._count.orders })));
}
