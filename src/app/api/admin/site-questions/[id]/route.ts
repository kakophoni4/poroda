import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const body = await request.json();
  const status = body?.status as string | undefined;
  if (status !== "new" && status !== "done") {
    return NextResponse.json({ error: "status: new | done" }, { status: 400 });
  }
  try {
    const row = await prisma.siteQuestion.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }
}
