import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folder = formData.get("folder");
  const subdir = folder === "banners" ? "banners" : folder === "concerns" ? "concerns" : "products";
  const UPLOAD_DIR = path.join(UPLOAD_ROOT, subdir);
  if (!file || !file.size) return NextResponse.json({ error: "Нет файла" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Только изображения (jpg, png, webp, gif)" }, { status: 400 });

  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.name) || ".jpg";
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const filePath = path.join(UPLOAD_DIR, name);
  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));
  const url = `/uploads/${subdir}/${name}`;
  return NextResponse.json({ url });
}
