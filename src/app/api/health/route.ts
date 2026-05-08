import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    return NextResponse.json({ ok: true, now: new Date().toISOString(), db: "ok" });
  } catch {
    return NextResponse.json(
      { ok: false, now: new Date().toISOString(), db: "fail" },
      { status: 503 }
    );
  }
}
