import { prisma } from "@/lib/db";

export type QuizAnswerPublic = {
  id: string;
  label: string;
  linkUrl: string;
  nextQuestionId: string | null;
};

export type QuizQuestionPublic = {
  id: string;
  title: string;
  sortOrder: number;
  answers: QuizAnswerPublic[];
};

export async function getQuizForPublic(): Promise<QuizQuestionPublic[]> {
  const delegate = (prisma as { quizQuestion?: { findMany: (args: unknown) => Promise<unknown[]> } }).quizQuestion;
  if (delegate?.findMany) {
    try {
      const rows = await delegate.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        include: {
          answers: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, label: true, linkUrl: true, nextQuestionId: true },
          },
        },
      });
      return rows as QuizQuestionPublic[];
    } catch {
      // fallback
    }
  }
  try {
    const questions = await prisma.$queryRaw<
      { id: string; title: string; sortOrder: number }[]
    >`SELECT id, title, "sortOrder" FROM "QuizQuestion" WHERE active = true ORDER BY "sortOrder" ASC`;
    if (!questions.length) return [];
    const out: QuizQuestionPublic[] = [];
    for (const q of questions) {
      const answers = await prisma.$queryRaw<QuizAnswerPublic[]>`
        SELECT id, label, "linkUrl", "nextQuestionId" FROM "QuizAnswer" WHERE "questionId" = ${q.id} ORDER BY "sortOrder" ASC
      `;
      out.push({ ...q, answers: answers ?? [] });
    }
    return out;
  } catch {
    return [];
  }
}

export type QuizAnswerAdmin = QuizAnswerPublic & { questionId: string; sortOrder: number };
export type QuizQuestionAdmin = QuizQuestionPublic & { active: boolean; answers: QuizAnswerAdmin[] };

export async function getQuizForAdmin(): Promise<QuizQuestionAdmin[]> {
  const delegate = (prisma as { quizQuestion?: { findMany: (args: unknown) => Promise<unknown[]> } }).quizQuestion;
  if (delegate?.findMany) {
    try {
      const rows = await delegate.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
          answers: { orderBy: { sortOrder: "asc" } },
        },
      });
      return rows as QuizQuestionAdmin[];
    } catch {
      // fallback
    }
  }
  try {
    const questions = await prisma.$queryRaw<
      { id: string; title: string; sortOrder: number; active: boolean }[]
    >`SELECT id, title, "sortOrder", active FROM "QuizQuestion" ORDER BY "sortOrder" ASC`;
    const out: QuizQuestionAdmin[] = [];
    for (const q of questions) {
      const answers = await prisma.$queryRaw<(QuizAnswerAdmin & { questionId: string })[]>`
        SELECT id, "questionId", label, "linkUrl", "nextQuestionId", "sortOrder" FROM "QuizAnswer" WHERE "questionId" = ${q.id} ORDER BY "sortOrder" ASC
      `;
      out.push({ ...q, answers: answers ?? [] });
    }
    return out;
  } catch {
    return [];
  }
}
