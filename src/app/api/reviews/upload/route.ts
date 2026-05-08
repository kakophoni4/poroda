import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { getUserSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertSameOrigin } from "@/lib/csrf";
import { findOrderForReviewAccess, getOrderReviewIneligibilityMessage } from "@/lib/review-order-access";
import { resolveUploadPath } from "@/lib/uploads";

const MAX_BYTES = 5 * 1024 * 1024;

const EXT: Record<"jpeg" | "png" | "webp", string> = {
  jpeg: ".jpg",
  png: ".png",
  webp: ".webp",
};

/** Не доверяем content-type: только сигнатура файла. */
function detectImageKindFromBuffer(u8: Uint8Array): "jpeg" | "png" | "webp" | null {
  if (u8.length < 3) return null;
  if (u8[0] === 0xff && u8[1] === 0xd8 && u8[2] === 0xff) return "jpeg";
  if (u8.length >= 8) {
    const isPng =
      u8[0] === 0x89 &&
      u8[1] === 0x50 &&
      u8[2] === 0x4e &&
      u8[3] === 0x47 &&
      u8[4] === 0x0d &&
      u8[5] === 0x0a &&
      u8[6] === 0x1a &&
      u8[7] === 0x0a;
    if (isPng) return "png";
  }
  if (u8.length >= 12) {
    const riff =
      u8[0] === 0x52 && u8[1] === 0x49 && u8[2] === 0x46 && u8[3] === 0x46;
    const webp =
      u8[8] === 0x57 && u8[9] === 0x45 && u8[10] === 0x42 && u8[11] === 0x50;
    if (riff && webp) return "webp";
  }
  return null;
}

/** Загрузка фото к отзыву (до отправки формы): orderId + rt или сессия владельца заказа */
export async function POST(request: NextRequest) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  try {
    const session = await getUserSession();
    const formData = await request.formData();
    const orderId = String(formData.get("orderId") ?? "");
    const token = formData.get("token") ? String(formData.get("token")) : null;
    const file = formData.get("file") as File | null;
    if (!file?.size) return NextResponse.json({ error: "Нет файла" }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "Файл больше 5 МБ" }, { status: 400 });
    const order = await findOrderForReviewAccess(orderId, { token, userId: session?.userId });
    if (!order) {
      return NextResponse.json({ error: "Заказ не найден или нет доступа" }, { status: 403 });
    }
    const block = getOrderReviewIneligibilityMessage(order);
    if (block) {
      return NextResponse.json({ error: block }, { status: 400 });
    }
    const existing = await prisma.customerReview.findUnique({ where: { orderId: order.id } });
    if (existing) {
      return NextResponse.json({ error: "По этому заказу отзыв уже отправлен" }, { status: 409 });
    }

    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "Файл больше 5 МБ" }, { status: 400 });
    }
    const u8 = new Uint8Array(bytes);
    const kind = detectImageKindFromBuffer(u8);
    if (!kind) {
      return NextResponse.json({ error: "Недопустимый формат" }, { status: 400 });
    }

    const uploadDir = resolveUploadPath("reviews");
    await mkdir(uploadDir, { recursive: true });
    const ext = EXT[kind];
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filePath = resolveUploadPath("reviews", name);
    await writeFile(filePath, Buffer.from(bytes));
    return NextResponse.json({ url: `/uploads/reviews/${name}` });
  } catch (e) {
    console.error("reviews/upload:", e);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}
