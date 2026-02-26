"use client";

import Link from "next/link";

export type BreadcrumbItem = { href?: string; label: string };

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Хлебные крошки" className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-600">
      <Link href="/" className="hover:text-zinc-900 transition-colors">
        Главная
      </Link>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            <span className="text-zinc-300" aria-hidden>/</span>
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-zinc-900 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-zinc-900 font-medium" : ""}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
