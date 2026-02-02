import Container from "@/components/Container";
import PageShell from "@/components/PageShell";

const items = [
  { q: "С чего начать уход?", a: "Начните с очищения, затем активы под задачу, затем крем." },
  { q: "Можно ли сочетать разные активы?", a: "Да, но не всё вместе. Добавим таблицу сочетаний позже." },
  { q: "Как понять, что средство подходит?", a: "Ориентируйтесь на задачу кожи и ощущения. Сделаем подсказки в карточках." },
];

export default function FaqPage() {
  return (
    <PageShell>
      <Container>
        <h1 className="text-3xl font-semibold">FAQ</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-700">
          Сюда перенесём ответы, порядок нанесения и базовые рекомендации.
        </p>

        <div className="mt-8 grid gap-4">
          {items.map((it) => (
            <div key={it.q} className="rounded-3xl border border-zinc-200 bg-white p-6">
              <div className="text-sm font-semibold">{it.q}</div>
              <div className="mt-2 text-sm leading-relaxed text-zinc-700">{it.a}</div>
            </div>
          ))}
        </div>
      </Container>
    </PageShell>
  );
}
