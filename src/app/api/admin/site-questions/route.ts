import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const rows = await prisma.siteQuestion.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}
