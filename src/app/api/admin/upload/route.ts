import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { resolveUploadPath } from "@/lib/uploads";
import { writeFile, mkdir } from "fs/promises";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 МБ
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
const SUBDIRS = ["banners", "concerns", "products"] as const;
type Subdir = (typeof SUBDIRS)[number];

export async function POST(request: NextRequest) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folderRaw = String(formData.get("folder") ?? "");
  const subdir: Subdir = (SUBDIRS as readonly string[]).includes(folderRaw)
    ? (folderRaw as Subdir)
    : "products";
  if (!file || !file.size) return NextResponse.json({ error: "Нет файла" }, { status: 400 });
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `Файл больше ${Math.floor(MAX_BYTES / 1024 / 1024)} МБ` }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Только изображения (jpg, png, webp, gif)" }, { status: 400 });
  }

  const uploadDir = resolveUploadPath(subdir);
  await mkdir(uploadDir, { recursive: true });
  const ext = EXT_BY_MIME[file.type] ?? ".jpg";
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const filePath = resolveUploadPath(subdir, name);
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: `Файл больше ${Math.floor(MAX_BYTES / 1024 / 1024)} МБ` }, { status: 400 });
  }
  await writeFile(filePath, Buffer.from(bytes));
  /** В БД сохраняем стабильный публичный URL — он одинаков и для public/uploads, и для UPLOAD_DIR через nginx alias/симлинк. */
  return NextResponse.json({ url: `/uploads/${subdir}/${name}` });
}
