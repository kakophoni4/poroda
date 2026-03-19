import { randomUUID } from "node:crypto";
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
};

async function getListViaRaw(): Promise<Row[]> {
  try {
    const rows = await prisma.$queryRaw<Row[]>`
      SELECT id, title, "imageUrl", "catalogQuery", "sortOrder", active, "createdAt", "updatedAt"
      FROM "HomeConcernCard"
      ORDER BY "sortOrder" ASC, "createdAt" DESC
    `;
    return rows ?? [];
  } catch {
    return [];
  }
}

async function createViaRaw(data: {
  title: string;
  imageUrl: string;
  catalogQuery: string;
  sortOrder: number;
  active: boolean;
}): Promise<Row> {
  const id = randomUUID();
  const now = new Date();
  await prisma.$executeRaw`
    INSERT INTO "HomeConcernCard" (id, title, "imageUrl", "catalogQuery", "sortOrder", active, "createdAt", "updatedAt")
    VALUES (${id}, ${data.title}, ${data.imageUrl}, ${data.catalogQuery}, ${data.sortOrder}, ${data.active}, ${now}, ${now})
  `;
  const [row] = await prisma.$queryRaw<Row[]>`SELECT * FROM "HomeConcernCard" WHERE id = ${id}`;
  if (!row) throw new Error("Create failed");
  return row;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const delegate = (prisma as { homeConcernCard?: { findMany: (args: unknown) => Promise<unknown[]> } }).homeConcernCard;
  try {
    if (delegate?.findMany) {
      const list = await delegate.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      });
      return NextResponse.json(list);
    }
    const list = await getListViaRaw();
    return NextResponse.json(list);
  } catch (e) {
    console.error("home-concern-cards GET:", e);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const { title, imageUrl, catalogQuery, sortOrder, active } = body as {
    title?: string;
    imageUrl?: string;
    catalogQuery?: string;
    sortOrder?: number;
    active?: boolean;
  };
  if (!title?.trim()) return NextResponse.json({ error: "Нужен заголовок" }, { status: 400 });
  if (!imageUrl?.trim()) return NextResponse.json({ error: "Нужно изображение" }, { status: 400 });

  const data = {
    title: title.trim(),
    imageUrl: imageUrl.trim(),
    catalogQuery: (catalogQuery ?? "").trim(),
    sortOrder: sortOrder ?? 0,
    active: active ?? true,
  };

  const delegate = (prisma as { homeConcernCard?: { create: (args: unknown) => Promise<unknown> } }).homeConcernCard;
  if (delegate?.create) {
    try {
      const row = await delegate.create({ data });
      return NextResponse.json(row);
    } catch (e: unknown) {
      const code = e && typeof e === "object" && "code" in e ? (e as { code: string }).code : "";
      const msg = e instanceof Error ? e.message : String(e);
      if (code === "P2021" || msg.includes("does not exist")) {
        return NextResponse.json(
          { error: "Таблица карточек проблем не создана. Выполни: npx prisma db push" },
          { status: 503 }
        );
      }
      if (code === "P1008") {
        return NextResponse.json(
          { error: "Таймаут соединения с базой. Проверь подключение (локальная БД или VPN)." },
          { status: 504 }
        );
      }
      console.error("home-concern-cards POST:", e);
      return NextResponse.json({ error: msg || "Ошибка при создании карточки" }, { status: 500 });
    }
  }

  try {
    const row = await createViaRaw(data);
    return NextResponse.json(row);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("does not exist") || msg.includes("relation")) {
      return NextResponse.json(
        { error: "Таблица карточек проблем не создана. Выполни: npx prisma db push" },
        { status: 503 }
      );
    }
    console.error("home-concern-cards POST (raw):", e);
    return NextResponse.json({ error: msg || "Ошибка при создании карточки" }, { status: 500 });
  }
}
