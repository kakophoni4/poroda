import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getUserSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { findOrderForReviewAccess } from "@/lib/review-order-access";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "reviews");
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

/** Загрузка фото к отзыву (до отправки формы): orderId + rt или сессия владельца заказа */
export async function POST(request: NextRequest) {
  try {
    const session = await getUserSession();
    const formData = await request.formData();
    const orderId = String(formData.get("orderId") ?? "");
    const token = formData.get("token") ? String(formData.get("token")) : null;
    const file = formData.get("file") as File | null;
    if (!file?.size) return NextResponse.json({ error: "Нет файла" }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "Файл больше 5 МБ" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Только изображения (jpg, png, webp, gif)" }, { status: 400 });
    }
    const order = await findOrderForReviewAccess(orderId, { token, userId: session?.userId });
    if (!order) {
      return NextResponse.json({ error: "Заказ не найден или нет доступа" }, { status: 403 });
    }
    if (order.status !== "delivered") {
      return NextResponse.json({ error: "Фото можно добавить после доставки заказа" }, { status: 400 });
    }
    const existing = await prisma.customerReview.findUnique({ where: { orderId: order.id } });
    if (existing) {
      return NextResponse.json({ error: "По этому заказу отзыв уже отправлен" }, { status: 409 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    const ext = path.extname(file.name) || ".jpg";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filePath = path.join(UPLOAD_DIR, name);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));
    const url = `/uploads/reviews/${name}`;
    return NextResponse.json({ url });
  } catch (e) {
    console.error("reviews/upload:", e);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}
