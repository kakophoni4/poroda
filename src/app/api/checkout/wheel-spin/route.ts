import { createHash, randomBytes } from "crypto";
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  CHECKOUT_WHEEL_SEGMENTS,
  CHECKOUT_WHEEL_SEGMENT_COUNT,
  TG_WHEEL_PRIZE_PERCENT,
} from "@/lib/checkout-wheel";

const TG_URL = "https://t.me/porodacosmetics";

function normalizeEmail(email: string): string | null {
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}

function normalizePhone(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (d.length < 10) return null;
  return d;
}

async function mintUniquePromoCode(
  tx: Prisma.TransactionClient,
  parts: { emailNorm: string; phoneNorm: string }
): Promise<string> {
  const salt = randomBytes(8).toString("hex");
  for (let i = 0; i < 32; i++) {
    const raw = createHash("sha256")
      .update(`${parts.emailNorm}|${parts.phoneNorm}|${salt}|${i}|${randomBytes(4).toString("hex")}`)
      .digest("hex");
    const code = ("PW" + raw.slice(0, 9)).toUpperCase();
    const exists = await tx.promo.findUnique({ where: { code } });
    if (!exists) return code;
  }
  throw new Error("wheel code collision");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const emailNorm = normalizeEmail(body?.email ?? "");
    const phoneNorm = normalizePhone(body?.phone ?? "");
    if (!emailNorm || !phoneNorm) {
      return NextResponse.json({ error: "Укажите корректные email и телефон (от 10 цифр)." }, { status: 400 });
    }

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const last = await prisma.wheelSpinLog.findFirst({
      where: { emailNorm, phoneNorm },
      orderBy: { createdAt: "desc" },
    });
    if (last && last.createdAt > hourAgo) {
      return NextResponse.json(
        { error: "Колесо можно крутить не чаще раза в час с этими контактами." },
        { status: 429 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.wheelGlobalCounter.upsert({
        where: { id: "singleton" },
        create: { id: "singleton", spins: 1 },
        update: { spins: { increment: 1 } },
      });
      const cnt = await tx.wheelGlobalCounter.findUnique({ where: { id: "singleton" } });
      const spinNumber = cnt?.spins ?? 1;

      const isTelegramPrize = spinNumber % 50 === 0;
      let segmentIndex: number;
      let percent: number;
      let discountRub: number | null;
      let validTo: Date;
      let description: string;

      if (isTelegramPrize) {
        segmentIndex = CHECKOUT_WHEEL_SEGMENT_COUNT - 1;
        percent = TG_WHEEL_PRIZE_PERCENT;
        discountRub = null;
        validTo = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        description = `Колесо: JACKPOT, спин #${spinNumber}`;
      } else {
        segmentIndex = Math.floor(Math.random() * 6);
        validTo = new Date(Date.now() + 60 * 60 * 1000);
        if (segmentIndex <= 2) {
          const rub = segmentIndex === 0 ? 200 : segmentIndex === 1 ? 250 : 300;
          percent = 0;
          discountRub = rub;
          description = `Колесо: −${rub} ₽, спин #${spinNumber}`;
        } else {
          const p = segmentIndex === 3 ? 5 : segmentIndex === 4 ? 10 : 15;
          percent = p;
          discountRub = null;
          description = `Колесо: −${p}%, спин #${spinNumber}`;
        }
      }

      const code = await mintUniquePromoCode(tx, { emailNorm, phoneNorm });
      await tx.promo.create({
        data: {
          code,
          percent,
          discountRub,
          description,
          maxUses: 1,
          usedCount: 0,
          validFrom: new Date(),
          validTo,
          active: true,
        },
      });
      await tx.wheelSpinLog.create({
        data: { emailNorm, phoneNorm },
      });

      const seg = CHECKOUT_WHEEL_SEGMENTS[segmentIndex];
      const hint = isTelegramPrize
        ? `Джекпот: промокод действует 7 дней. Напишите в Telegram (${TG_URL.replace("https://", "")}) за подарком по акции. Скидка ${TG_WHEEL_PRIZE_PERCENT}% — введите код в поле «Промокод».`
        : "Промокод действует 1 час с момента выпадения. Успейте оформить заказ — введите код в поле «Промокод».";

      return {
        code,
        segmentIndex,
        label: seg.label,
        isTelegramPrize,
        validUntil: validTo.toISOString(),
        hint,
        spinNumber,
      };
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("wheel-spin:", e);
    return NextResponse.json({ error: "Не удалось прокрутить колесо." }, { status: 500 });
  }
}
