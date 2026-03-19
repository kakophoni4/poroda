import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Row = {
  id: string;
  title: string;
  imageUrl: string;
  catalogQuery: string;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const title = body.title != null ? String(body.title).trim() : undefined;
  const imageUrl = body.imageUrl != null ? String(body.imageUrl).trim() : undefined;
  const catalogQuery = body.catalogQuery != null ? String(body.catalogQuery).trim() : undefined;
  const sortOrder = body.sortOrder != null ? Number(body.sortOrder) || 0 : undefined;
  const active = body.active != null ? !!body.active : undefined;

  const delegate = (prisma as { homeConcernCard?: { update: (args: unknown) => Promise<Row> } }).homeConcernCard;
  if (delegate?.update) {
    try {
      const row = await delegate.update({
        where: { id },
        data: {
          ...(title != null && { title }),
          ...(imageUrl != null && { imageUrl }),
          ...(catalogQuery != null && { catalogQuery }),
          ...(sortOrder != null && { sortOrder }),
          ...(active != null && { active }),
        },
      });
      return NextResponse.json(row);
    } catch (e) {
      console.error("home-concern-cards PATCH delegate:", e);
    }
  }

  try {
    const now = new Date();
    const [existing] = await prisma.$queryRaw<Row[]>`SELECT * FROM "HomeConcernCard" WHERE id = ${id}`;
    if (!existing) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

    const next = {
      title: title ?? existing.title,
      imageUrl: imageUrl ?? existing.imageUrl,
      catalogQuery: catalogQuery ?? existing.catalogQuery,
      sortOrder: sortOrder ?? existing.sortOrder,
      active: active ?? existing.active,
    };

    await prisma.$executeRaw`
      UPDATE "HomeConcernCard"
      SET title = ${next.title}, "imageUrl" = ${next.imageUrl}, "catalogQuery" = ${next.catalogQuery},
          "sortOrder" = ${next.sortOrder}, active = ${next.active}, "updatedAt" = ${now}
      WHERE id = ${id}
    `;
    const [row] = await prisma.$queryRaw<Row[]>`SELECT * FROM "HomeConcernCard" WHERE id = ${id}`;
    if (!row) return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
    return NextResponse.json(row);
  } catch (e) {
    console.error("home-concern-cards PATCH raw:", e);
    return NextResponse.json({ error: "Не удалось сохранить" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const delegate = (prisma as { homeConcernCard?: { delete: (args: unknown) => Promise<unknown> } }).homeConcernCard;
  if (delegate?.delete) {
    try {
      await delegate.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    } catch {
      // fallback
    }
  }

  try {
    await prisma.$executeRaw`DELETE FROM "HomeConcernCard" WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("home-concern-cards DELETE:", e);
    return NextResponse.json({ error: "Не удалось удалить" }, { status: 500 });
  }
}
