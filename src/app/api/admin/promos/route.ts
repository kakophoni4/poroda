import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { parseMinOrderTotal } from "@/lib/min-order-total";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const promos = await prisma.promo.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(promos);
}

export async function POST(request: NextRequest) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const {
    code,
    percent,
    description,
    maxUses,
    validFrom,
    validTo,
    active,
    isDermatologist,
    dermatologistRewardPercent,
    minOrderTotal,
  } = body as {
    code: string;
    percent: number;
    description?: string;
    maxUses?: number;
    validFrom?: string;
    validTo?: string;
    active?: boolean;
    isDermatologist?: boolean;
    dermatologistRewardPercent?: number | null;
    minOrderTotal?: unknown;
  };
  if (!code?.trim() || percent == null) return NextResponse.json({ error: "code, percent обязательны" }, { status: 400 });
  const minParsed = parseMinOrderTotal(minOrderTotal);
  if (!minParsed.ok) return NextResponse.json({ error: minParsed.error }, { status: 400 });
  const derm = !!isDermatologist;
  const reward = dermatologistRewardPercent;
  if (derm && (reward == null || reward < 0 || reward > 100 || !Number.isFinite(reward))) {
    return NextResponse.json(
      { error: "Для промокода дерматолога укажите процент вознаграждения от 0 до 100" },
      { status: 400 },
    );
  }
  const promo = await prisma.promo.create({
    data: {
      code: code.trim().toUpperCase(),
      percent,
      description: description?.trim() || null,
      minOrderTotal: minParsed.value,
      maxUses: maxUses ?? null,
      validFrom: validFrom ? new Date(validFrom) : null,
      validTo: validTo ? new Date(validTo) : null,
      active: active ?? true,
      isDermatologist: derm,
      dermatologistRewardPercent: derm ? Math.round(Number(reward)) : null,
    },
  });
  return NextResponse.json(promo);
}
