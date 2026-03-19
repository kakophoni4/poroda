import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getQuizForAdmin } from "@/lib/quiz";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const list = await getQuizForAdmin();
  return NextResponse.json(list);
}
