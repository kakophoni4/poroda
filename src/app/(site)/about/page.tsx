import Container from "@/components/Container";
import PageShell from "@/components/PageShell";

export default function AboutPage() {
  return (
    <PageShell>
      <Container>
        <h1 className="text-3xl font-semibold">О бренде</h1>

        <div className="mt-6 max-w-3xl space-y-4 text-sm leading-relaxed text-zinc-700">
          <p>
            PORODA — российский бренд уходовой косметики. Мы создаём продукты так, чтобы они поддерживали здоровье кожи
            и помогали решать конкретные задачи — спокойно и без перегруза.
          </p>
          <p>
            Наша цель — помогать женщинам принимать и ценить свою индивидуальность, открывая свою «породу» —
            естественную красоту и уникальные черты.
          </p>
          <p>
            Сейчас мы собираем новый многостраничный сайт на Node.js: фиксируем структуру, тексты и логику,
            затем подключим каталог, карточки товаров и фильтры.
          </p>
        </div>
      </Container>
    </PageShell>
  );
}
