import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(body.slug != null && { slug: body.slug }),
      ...(body.title != null && { title: body.title }),
      ...(body.sortOrder != null && { sortOrder: body.sortOrder }),
    },
  });
  return NextResponse.json(category);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount === 0) {
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true, action: "deleted" as const, message: "Категория удалена." });
  }
  const category = await prisma.category.update({
    where: { id },
    data: { archivedAt: new Date() },
  });
  return NextResponse.json({
    ok: true,
    action: "archived" as const,
    message:
      "Категория заархивирована: в ней ещё есть товары (ограничение внешнего ключа). Снимите товары или перенесите в другую категорию — тогда сможно удалить запись.",
    category,
  });
}
