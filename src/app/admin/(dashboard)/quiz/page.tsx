import AdminQuizClient from "./AdminQuizClient";
import { getQuizForAdmin } from "@/lib/quiz";

export const dynamic = "force-dynamic";

export default async function AdminQuizPage() {
  const questions = await getQuizForAdmin();
  return (
    <>
      <h1 className="text-2xl font-semibold">Квиз подбора</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Всплывает на главной после 3 минут. Настройте вопросы и ответы: заголовок, варианты (сухая/жирная/комбинированная и т.д.), куда ведёт каждый ответ — ссылка или следующий вопрос.
      </p>
      <AdminQuizClient initial={questions} />
    </>
  );
}
