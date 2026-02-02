import Container from "./Container";
import Logo from "./Logo";

const nav = [
  { href: "/catalog", label: "Каталог" },
  { href: "/philosophy", label: "Философия" },
  { href: "/about", label: "О бренде" },
  { href: "/blog", label: "Блог" },
  { href: "/faq", label: "FAQ" },
  { href: "/partners", label: "Партнёрам" },
  { href: "/contacts", label: "Контакты" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <a href="/" className="shrink-0">
            <Logo />
          </a>

          <nav className="hidden items-center gap-5 lg:flex">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="text-sm text-zinc-700 hover:text-zinc-900">
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="/catalog"
              className="hidden rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 sm:inline-flex"
            >
              В каталог
            </a>
            <a
              href="/contacts"
              className="rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Написать
            </a>
          </div>
        </div>

        <div className="pb-3 lg:hidden">
          <div className="flex flex-wrap gap-2">
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
              >
                {n.label}
              </a>
            ))}
          </div>
        </div>
      </Container>
    </header>
  );
}
