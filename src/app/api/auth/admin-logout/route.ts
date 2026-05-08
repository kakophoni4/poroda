import { NextRequest, NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  await clearAdminSession();
  return NextResponse.json({ ok: true });
}
