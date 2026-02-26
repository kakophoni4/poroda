import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const promos = await prisma.promo.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(promos);
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const { code, percent, description, maxUses, validFrom, validTo, active } = body as {
    code: string;
    percent: number;
    description?: string;
    maxUses?: number;
    validFrom?: string;
    validTo?: string;
    active?: boolean;
  };
  if (!code?.trim() || percent == null) return NextResponse.json({ error: "code, percent обязательны" }, { status: 400 });
  const promo = await prisma.promo.create({
    data: {
      code: code.trim().toUpperCase(),
      percent,
      description: description?.trim() || null,
      maxUses: maxUses ?? null,
      validFrom: validFrom ? new Date(validFrom) : null,
      validTo: validTo ? new Date(validTo) : null,
      active: active ?? true,
    },
  });
  return NextResponse.json(promo);
}
