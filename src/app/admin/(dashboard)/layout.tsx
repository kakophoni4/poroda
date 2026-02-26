import Container from "@/components/Container";
import Link from "next/link";
import AdminLogout from "./AdminLogout";

const adminNav = [
  { href: "/admin", label: "Дашборд" },
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/promos", label: "Скидки" },
  { href: "/admin/mailings", label: "Рассылки" },
  { href: "/admin/analytics", label: "Аналитика" },
  { href: "/admin/users", label: "Клиенты" },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-100 py-8">
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="lg:w-52 shrink-0">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="text-sm font-semibold text-zinc-500">Админ-панель</div>
              <nav className="mt-4 flex flex-col gap-1">
                {adminNav.map((item) => (
                  <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100">
                    {item.label}
                  </Link>
                ))}
              </nav>
              <AdminLogout className="mt-4 block text-sm text-zinc-500 hover:text-zinc-700" />
              <Link href="/" className="mt-2 block text-sm text-zinc-500 hover:text-zinc-700">← На сайт</Link>
            </div>
          </aside>
          <main className="min-w-0 flex-1 rounded-2xl border border-zinc-200 bg-white p-6">{children}</main>
        </div>
      </Container>
    </div>
  );
}
