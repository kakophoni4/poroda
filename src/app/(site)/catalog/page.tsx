import Container from "@/components/Container";
import PageShell from "@/components/PageShell";

export default function CatalogPage() {
  return (
    <PageShell>
      <Container>
        <h1 className="text-3xl font-semibold">Каталог</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-700">
          Раздел в разработке. Следующий шаг — категории, фильтры и карточки товаров.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {["Очищение", "Тонизация", "Сыворотки", "Кремы", "Маски", "Наборы"].map((c) => (
            <div key={c} className="rounded-3xl border border-zinc-200 bg-white p-6">
              <div className="text-sm font-semibold">{c}</div>
              <div className="mt-2 text-sm text-zinc-600">
                Скоро здесь будет список товаров и фильтры.
              </div>
            </div>
          ))}
        </div>
      </Container>
    </PageShell>
  );
}
