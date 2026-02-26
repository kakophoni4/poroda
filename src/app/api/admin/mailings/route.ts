import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const mailings = await prisma.mailing.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(mailings);
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const { subject, body: mailBody } = body as { subject: string; body: string };
  if (!subject?.trim()) return NextResponse.json({ error: "subject обязателен" }, { status: 400 });
  const mailing = await prisma.mailing.create({
    data: { subject: subject.trim(), body: mailBody?.trim() || "" },
  });
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const u of users) {
    await prisma.userNotification.create({
      data: { userId: u.id, title: subject, body: mailBody?.trim() || null },
    });
  }
  await prisma.mailing.update({
    where: { id: mailing.id },
    data: { sentAt: new Date() },
  });
  return NextResponse.json({ ...mailing, sentTo: users.length });
}
