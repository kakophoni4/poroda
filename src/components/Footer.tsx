import Container from "./Container";

export default function Footer() {
  return (
    <footer className="mt-8">
      <Container>
        <div className="liquidGlass-dock grid gap-10 rounded-3xl border border-white/40 px-6 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          <div>
            <div className="text-sm font-semibold">PORODA Cosmetics</div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="font-semibold">Разделы</div>
            <a className="block text-zinc-600 hover:text-zinc-900" href="/catalog">Продукция</a>
            <a className="block text-zinc-600 hover:text-zinc-900" href="/blog">Блог</a>
            <a className="block text-zinc-600 hover:text-zinc-900" href="/faq">FAQ</a>
            <a className="block text-zinc-600 hover:text-zinc-900" href="/delivery">Доставка</a>
          </div>

          <div className="space-y-2 text-sm">
            <div className="font-semibold">Документы</div>
            <a className="block text-zinc-600 hover:text-zinc-900" href="/legal/privacy">Политика</a>
            <a className="block text-zinc-600 hover:text-zinc-900" href="/legal/offer">Оферта</a>
            <a className="block text-zinc-600 hover:text-zinc-900" href="/legal/terms">Пользовательское соглашение</a>
          </div>

          <div className="space-y-2 text-sm">
            <div className="font-semibold">Контакты</div>
            <a className="block text-zinc-600 hover:text-zinc-900" href="mailto:hello@porodacosmetics.ru">hello@porodacosmetics.ru</a>
            <a className="block text-zinc-600 hover:text-zinc-900" href="tel:+79084838717">+7 908 483-87-17</a>
            <a className="glass-subtle inline-flex rounded-2xl border border-white/45 px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-white/45" href="/contacts">
              Контакты и реквизиты
            </a>
            <a className="mt-2 block text-xs text-zinc-500 hover:text-zinc-700" href="/admin">
              Админ-панель
            </a>
          </div>
        </div>

        <div className="pt-6 space-y-2 text-xs text-zinc-500">
          <div>
            © {new Date().getFullYear()} PORODA Cosmetics. ИП Гафурова Г. Г., ИНН 732300053171, ОГРНИП 304732315200073.
          </div>
          <div>Юридический адрес: Россия 433000 Ульяновская обл, р-н Чердаклинский, рп Чердаклы, ул. 50 лет ВЛКСМ, 117.</div>
        </div>
      </Container>
    </footer>
  );
}
