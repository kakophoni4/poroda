import Container from "@/components/Container";
import PageShell from "@/components/PageShell";

export default function ContactsPage() {
  return (
    <PageShell>
      <Container>
        <h1 className="text-3xl font-semibold">Контакты</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-700">
          Добавим email, телефон, соцсети и форму обратной связи.
        </p>

        <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6">
          <div className="text-sm font-semibold">Форма (заглушка)</div>
          <div className="mt-2 text-sm text-zinc-600">
            На следующем шаге подключим отправку (например, в Telegram/Email).
          </div>
        </div>
      </Container>
    </PageShell>
  );
}
