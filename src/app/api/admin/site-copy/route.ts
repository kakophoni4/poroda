import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SITE_COPY_DEFAULTS_MAP, SITE_COPY_SCHEMA } from "@/lib/site-copy-schema";

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const entries = body?.entries as Record<string, string> | undefined;
  if (!entries || typeof entries !== "object") {
    return NextResponse.json({ error: "Нужен объект entries" }, { status: 400 });
  }

  for (const item of SITE_COPY_SCHEMA) {
    const raw = entries[item.key];
    const v = raw == null ? "" : String(raw).trim();
    const def = SITE_COPY_DEFAULTS_MAP[item.key] ?? "";
    if (!v || v === def) {
      await prisma.siteCopy.deleteMany({ where: { key: item.key } }).catch(() => {});
    } else {
      await prisma.siteCopy.upsert({
        where: { key: item.key },
        create: { key: item.key, value: v },
        update: { value: v },
      });
    }
  }

  revalidateTag("site-copy", "default");
  return NextResponse.json({ ok: true });
}
