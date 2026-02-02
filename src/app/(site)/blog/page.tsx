import Container from "@/components/Container";
import PageShell from "@/components/PageShell";

export default function BlogPage() {
  return (
    <PageShell>
      <Container>
        <h1 className="text-3xl font-semibold">Блог</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-700">
          Скоро здесь будут статьи и гайды. Сейчас мы зафиксировали структуру и дизайн.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-3xl border border-zinc-200 bg-white p-6">
              <div className="text-xs text-zinc-500">Скоро</div>
              <div className="mt-2 text-base font-semibold">Материал #{i}</div>
              <div className="mt-2 text-sm text-zinc-700">
                Заглушка статьи, чтобы показать многостраничную структуру.
              </div>
            </div>
          ))}
        </div>
      </Container>
    </PageShell>
  );
}
