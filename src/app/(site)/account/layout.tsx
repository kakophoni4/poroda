import Container from "@/components/Container";
import Link from "next/link";

const accountNav = [
  { href: "/account", label: "Обзор" },
  { href: "/account/orders", label: "История заказов" },
  { href: "/account/discounts", label: "Скидки" },
  { href: "/account/notifications", label: "Уведомления" },
  { href: "/account/profile", label: "Профиль" },
];

const navBtnClass =
  "rounded-xl border border-zinc-200 bg-white px-4 py-2 text-center text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-10 sm:py-14">
      <Container>
        <div className="flex flex-col gap-8">
          <nav className="flex flex-wrap justify-center gap-2">
            {accountNav.map((item) => (
              <Link key={item.href} href={item.href} className={navBtnClass}>
                {item.label}
              </Link>
            ))}
          </nav>
          <main className="min-w-0 w-full">
            <div className="mx-auto w-full max-w-xl text-center">{children}</div>
          </main>
        </div>
      </Container>
    </div>
  );
}
