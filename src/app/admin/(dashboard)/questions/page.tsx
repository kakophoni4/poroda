import type { SiteQuestion } from "@prisma/client";
import AdminQuestionsClient from "./AdminQuestionsClient";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminQuestionsPage() {
  let initial: SiteQuestion[] = [];
  try {
    initial = await prisma.siteQuestion.findMany({ orderBy: { createdAt: "desc" } });
  } catch {
    // нет БД
  }
  return (
    <>
      <h1 className="text-2xl font-semibold">Вопросы с сайта</h1>
      <p className="mt-1 text-sm text-zinc-600">Сообщения из формы на странице «О нас — отзывы».</p>
      <AdminQuestionsClient initial={initial} />
    </>
  );
}
