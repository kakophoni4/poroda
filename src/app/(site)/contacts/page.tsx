import Container from "@/components/Container";
import PageShell from "@/components/PageShell";

export default function ContactsPage() {
  return (
    <PageShell>
      <Container className="max-w-2xl">
        <h1 className="text-3xl font-semibold">Контакты</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-700">
          Свяжитесь с нами по почте или телефону. По вопросам сотрудничества и дистрибуции — страница{" "}
          <a href="/partners" className="font-medium text-zinc-900 underline underline-offset-2 hover:no-underline">
            Партнёрам
          </a>
          .
        </p>

        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <div className="liquidGlass-dock rounded-3xl border border-white/40 p-6">
            <div className="text-sm font-semibold text-zinc-900">Почта и телефон</div>
            <a
              href="mailto:hello@porodacosmetics.ru"
              className="mt-2 block text-zinc-700 hover:text-zinc-900"
            >
              hello@porodacosmetics.ru
            </a>
            <a
              href="tel:+79084838717"
              className="mt-1 block text-zinc-700 hover:text-zinc-900"
            >
              +7 908 483-87-17
            </a>
          </div>
        </div>

        <div className="liquidGlass-dock mt-8 rounded-3xl border border-white/40 p-6 sm:p-8">
          <div className="text-sm font-semibold text-zinc-900">Реквизиты</div>
          <address className="mt-3 text-sm leading-relaxed text-zinc-700 not-italic">
            Индивидуальный предприниматель Гафурова Гельнур Габдельхаковна
            <br />
            ИНН 732300053171
            <br />
            ОГРНИП 304732315200073
            <br />
            Юридический адрес: Россия 433000 Ульяновская обл, р-н Чердаклинский, рп Чердаклы, ул. 50 лет ВЛКСМ, 117
          </address>
        </div>

        <div className="mt-8 rounded-3xl border border-white/40 bg-white/5 p-6">
          <div className="text-sm font-semibold text-zinc-900">Форма обратной связи</div>
          <div className="mt-2 text-sm text-zinc-600">
            На следующем шаге подключим отправку (например, в Telegram/Email).
          </div>
        </div>
      </Container>
    </PageShell>
  );
}
