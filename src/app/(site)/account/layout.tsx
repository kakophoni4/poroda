import Container from "@/components/Container";
import Link from "next/link";

const accountNav = [
  { href: "/account", label: "Обзор" },
  { href: "/account/orders", label: "История заказов" },
  { href: "/account/discounts", label: "Скидки" },
  { href: "/account/notifications", label: "Уведомления" },
  { href: "/account/profile", label: "Профиль" },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-10 sm:py-14">
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="lg:w-56 shrink-0">
            <nav className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {accountNav.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 lg:border-0 lg:bg-transparent lg:py-1.5 lg:font-normal">
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </Container>
    </div>
  );
}
