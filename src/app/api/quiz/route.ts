import { NextResponse } from "next/server";
import { getQuizForPublic } from "@/lib/quiz";

export async function GET() {
  const quiz = await getQuizForPublic();
  return NextResponse.json(quiz);
}
