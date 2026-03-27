import { NextRequest, NextResponse } from "next/server";
import { applyPromoToTotal } from "@/lib/apply-promo";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim();
  const totalRaw = url.searchParams.get("total");
  const total = totalRaw != null ? Number(totalRaw) : NaN;
  if (!code || !Number.isFinite(total) || total < 0) {
    return NextResponse.json({ ok: false, error: "Нужны code и total" }, { status: 400 });
  }
  try {
    const promo = await prisma.promo.findFirst({
      where: { code: code.toUpperCase(), active: true },
    });
    if (!promo) {
      return NextResponse.json({ ok: false, error: "Промокод не найден" });
    }
    const r = applyPromoToTotal(total, promo);
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: r.reason });
    }
    return NextResponse.json({ ok: true, finalTotal: r.finalTotal });
  } catch {
    return NextResponse.json({ ok: false, error: "Ошибка проверки" }, { status: 500 });
  }
}
