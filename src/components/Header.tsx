"use client";

import { useState, useRef, useEffect } from "react";
import Container from "./Container";
import Logo from "./Logo";
import Link from "next/link";
import { categories } from "@/lib/catalog-data";

const mainNav = [
  { href: "/catalog", label: "Каталог", hasDropdown: true },
  { href: "/philosophy", label: "Философия", hasDropdown: false },
  { href: "/about", label: "О бренде", hasDropdown: false },
  { href: "/blog", label: "Блог", hasDropdown: false },
  { href: "/faq", label: "FAQ", hasDropdown: false },
  { href: "/partners", label: "Партнёрам", hasDropdown: false },
  { href: "/contacts", label: "Контакты", hasDropdown: false },
];

export default function Header() {
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCatalogOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur-md">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="shrink-0" aria-label="На главную">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" ref={dropdownRef}>
            {mainNav.map((n) =>
              n.hasDropdown ? (
                <div
                  key={n.href}
                  className="relative"
                  onMouseEnter={() => setCatalogOpen(true)}
                  onMouseLeave={() => setCatalogOpen(false)}
                >
                  <Link
                    href={n.href}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                  >
                    {n.label}
                    <svg className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Link>
                  {catalogOpen && (
                    <div className="absolute left-0 top-full pt-1">
                      <div className="min-w-[220px] rounded-2xl border border-zinc-200 bg-white py-2 shadow-lg">
                        <Link
                          href="/catalog"
                          className="block px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                        >
                          Весь каталог
                        </Link>
                        {categories.map((c) => (
                          <Link
                            key={c.slug}
                            href={`/catalog?category=${c.slug}`}
                            className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                          >
                            {c.title} ({c.productCount})
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                >
                  {n.label}
                </Link>
              )
            )}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/account"
              className="hidden rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 sm:inline-flex"
            >
              Кабинет
            </Link>
            <Link
              href="/contacts"
              className="rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Написать
            </Link>
            <button
              type="button"
              className="rounded-2xl p-2 lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Меню"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ease-out lg:hidden ${mobileMenuOpen ? "max-h-[400px] pb-3" : "max-h-0"}`}
        >
          <div className="flex flex-col gap-1 border-t border-zinc-200 pt-3">
            <Link href="/catalog" className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-900">
              Каталог
            </Link>
            {categories.slice(0, 4).map((c) => (
              <Link
                key={c.slug}
                href={`/catalog?category=${c.slug}`}
                className="rounded-lg px-5 py-2 text-sm text-zinc-600"
              >
                {c.title}
              </Link>
            ))}
            {mainNav.filter((n) => !n.hasDropdown).map((n) => (
              <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm text-zinc-700">
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </header>
  );
}
