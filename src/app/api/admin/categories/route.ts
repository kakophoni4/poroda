import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const { slug, title, sortOrder } = body as { slug: string; title: string; sortOrder?: number };
  if (!slug || !title) return NextResponse.json({ error: "slug, title обязательны" }, { status: 400 });
  const category = await prisma.category.create({
    data: { slug: slug.trim(), title: title.trim(), sortOrder: sortOrder ?? 0 },
  });
  return NextResponse.json(category);
}
