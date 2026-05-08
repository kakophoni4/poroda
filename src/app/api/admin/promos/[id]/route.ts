import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { parseMinOrderTotal } from "@/lib/min-order-total";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const existing = await prisma.promo.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Не найден" }, { status: 404 });

  const body = await request.json();
  const isDerm =
    body.isDermatologist !== undefined ? !!body.isDermatologist : existing.isDermatologist;

  let rewardPercent: number | null =
    body.dermatologistRewardPercent !== undefined
      ? body.dermatologistRewardPercent === null || body.dermatologistRewardPercent === ""
        ? null
        : Math.round(Number(body.dermatologistRewardPercent))
      : existing.dermatologistRewardPercent;

  if (!isDerm) rewardPercent = null;
  else {
    const r = rewardPercent ?? NaN;
    if (!Number.isFinite(r) || r < 0 || r > 100) {
      return NextResponse.json(
        { error: "Для промокода дерматолога укажите процент вознаграждения от 0 до 100" },
        { status: 400 },
      );
    }
  }

  let minOrderTotalValue: number | null | undefined;
  if (body.minOrderTotal !== undefined) {
    const p = parseMinOrderTotal((body as { minOrderTotal?: unknown }).minOrderTotal);
    if (!p.ok) return NextResponse.json({ error: p.error }, { status: 400 });
    minOrderTotalValue = p.value;
  }

  const promo = await prisma.promo.update({
    where: { id },
    data: {
      ...(body.code != null && { code: body.code.trim().toUpperCase() }),
      ...(body.percent != null && { percent: body.percent }),
      ...(body.description != null && { description: body.description || null }),
      ...(body.maxUses != null && { maxUses: body.maxUses === "" ? null : body.maxUses }),
      ...(body.validFrom != null && { validFrom: body.validFrom ? new Date(body.validFrom) : null }),
      ...(body.validTo != null && { validTo: body.validTo ? new Date(body.validTo) : null }),
      ...(body.active != null && { active: !!body.active }),
      ...(minOrderTotalValue !== undefined && { minOrderTotal: minOrderTotalValue }),
      isDermatologist: isDerm,
      dermatologistRewardPercent: rewardPercent,
    },
  });
  return NextResponse.json(promo);
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
  await prisma.promo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
