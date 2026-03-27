import Link from "next/link";

export const ABOUT_SUBNAV = [
  { href: "/about", label: "О бренде" },
  { href: "/philosophy", label: "Наша философия" },
  { href: "/about/reviews", label: "Отзывы" },
  { href: "/blog", label: "Блог" },
  { href: "/contacts", label: "Контакты" },
] as const;

type Props = { activeHref: string };

/** Единые плашки-вкладки для разделов «о бренде» */
export default function AboutSubnav({ activeHref }: Props) {
  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
      aria-label="Разделы о бренде"
    >
      {ABOUT_SUBNAV.map((item) => {
        const isActive = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`text-sm font-medium transition-colors ${
              isActive
                ? "rounded-2xl border border-zinc-900 bg-zinc-900 px-4 py-2 text-white"
                : "rounded-lg px-3 py-2 text-zinc-700 underline decoration-transparent underline-offset-[6px] hover:text-zinc-900 hover:decoration-zinc-400"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
