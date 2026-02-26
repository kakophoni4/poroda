import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ user: null });
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, phone: true },
  });
  return NextResponse.json({ user: user || null });
}
