import Container from "./Container";

export default function Footer() {
  return (
    <footer className="mt-14 border-t border-zinc-200 bg-white">
      <Container>
        <div className="grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-sm font-semibold">PORODA Cosmetics</div>
            <div className="mt-2 text-sm text-zinc-600">
              Многостраничный сайт на Node.js. Фото добавим позже — сейчас фиксируем структуру и смысл.
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="font-semibold">Разделы</div>
            <a className="block text-zinc-600 hover:text-zinc-900" href="/catalog">Каталог</a>
            <a className="block text-zinc-600 hover:text-zinc-900" href="/blog">Блог</a>
            <a className="block text-zinc-600 hover:text-zinc-900" href="/faq">FAQ</a>
            <a className="block text-zinc-600 hover:text-zinc-900" href="/delivery">Доставка</a>
          </div>

          <div className="space-y-2 text-sm">
            <div className="font-semibold">Документы</div>
            <a className="block text-zinc-600 hover:text-zinc-900" href="/legal/privacy">Политика</a>
            <a className="block text-zinc-600 hover:text-zinc-900" href="/legal/offer">Оферта</a>
          </div>

          <div className="space-y-2 text-sm">
            <div className="font-semibold">Контакты</div>
            <div className="text-zinc-600">Email/телефон добавим</div>
            <a className="inline-flex rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50" href="/contacts">
              Открыть контакты
            </a>
            <a className="mt-2 block text-xs text-zinc-500 hover:text-zinc-700" href="/admin">
              Админ-панель
            </a>
          </div>
        </div>

        <div className="border-t border-zinc-200 py-6 text-xs text-zinc-500">
          © {new Date().getFullYear()} PORODA Cosmetics. Все права защищены.
        </div>
      </Container>
    </footer>
  );
}
