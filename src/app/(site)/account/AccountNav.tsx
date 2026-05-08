"use client";

import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

const accountNav = [
  { href: "/account", label: "Обзор" },
  { href: "/account/orders", label: "История заказов" },
  { href: "/account/discounts", label: "Скидки" },
  { href: "/account/notifications", label: "Уведомления" },
  { href: "/account/profile", label: "Профиль" },
];

const navBtnClass =
  "cursor-pointer rounded-xl border border-zinc-200 bg-white px-4 py-2 text-center text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50";

export default function AccountNav() {
  return (
    <nav className="flex flex-wrap justify-center gap-2">
      {accountNav.map((item) => (
        <Link key={item.href} href={item.href} className={navBtnClass}>
          {item.label}
        </Link>
      ))}
      <LogoutButton className={navBtnClass} />
    </nav>
  );
}
