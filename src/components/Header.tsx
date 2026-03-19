"use client";

import { useState, useRef, useEffect } from "react";
import Container from "./Container";
import Logo from "./Logo";
import Link from "next/link";
import { headerSloganLines } from "@/lib/site-data";

const aboutDropdownLinks = [
  { href: "/about", label: "О бренде" },
  { href: "/philosophy", label: "Наша философия" },
  { href: "/blog", label: "Блог" },
  { href: "/contacts", label: "Контакты" },
];

const catalogFilterLinks = [
  { href: "/catalog", label: "Вся продукция" },
  { href: "/catalog?filter=promo", label: "Акции" },
  { href: "/catalog?filter=new", label: "Новинки" },
  { href: "/catalog?filter=bestseller", label: "Бестселлеры" },
];

const mainNav = [
  { href: "/catalog", label: "Вся продукция", hasDropdown: true, dropdownType: "catalog" as const, dropdownLinks: catalogFilterLinks },
  { href: "/about", label: "О нас", hasDropdown: true, dropdownType: "about" as const, dropdownLinks: aboutDropdownLinks },
  { href: "/faq", label: "FAQ", hasDropdown: false },
  { href: "/partners", label: "Партнёрам", hasDropdown: false },
];

/** Пункты с подменю: без стрелки — пунктирное подчёркивание как намёк на раскрытие */
const navDropdownLinkClass =
  "inline-flex items-center rounded-xl px-3 py-2 text-base font-medium text-zinc-800 underline decoration-dotted decoration-zinc-500/80 underline-offset-[6px] hover:bg-white/40 hover:text-zinc-900 hover:decoration-zinc-800 sm:text-[1.05rem]";
const navPlainClass =
  "rounded-xl px-3 py-2 text-base font-medium text-zinc-800 hover:bg-white/40 hover:text-zinc-900 sm:text-[1.05rem]";
const mobileDropdownBtnClass =
  "glass-subtle inline-flex shrink-0 items-center rounded-xl border border-white/45 px-3.5 py-2 text-sm font-semibold text-zinc-800 shadow-sm underline decoration-dotted decoration-zinc-500/80 underline-offset-[5px] transition hover:bg-white/45";
/** Пункты выпадающих «О нас» / «Вся продукция» — только текст, без плашек */
const dropdownItemClass =
  "block rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 underline decoration-transparent underline-offset-[6px] transition hover:text-zinc-900 hover:decoration-zinc-400";

export default function Header() {
  const [openDropdown, setOpenDropdown] = useState<"catalog" | "about" | null>(null);
  const [mobileOpen, setMobileOpen] = useState<"catalog" | "about" | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: Event) {
      const t = e.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(t)) {
        setOpenDropdown(null);
      }
      if (mobileNavRef.current && !mobileNavRef.current.contains(t)) {
        setMobileOpen(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <header id="site-header-root" className="sticky top-0 z-50">
      <div className="liquidGlass-dock w-full overflow-visible border-b border-white/40 shadow-sm">
        <Container className="!px-3 sm:!px-4 lg:!px-6">
          {/* Верх: слоган, лого, кнопки — затем навигация сразу под лого */}
          <div className="flex flex-col gap-0">
            <div className="relative flex min-h-[2.5rem] shrink-0 items-center py-1">
              <p className="z-[1] max-w-[44%] -translate-x-1 text-left text-[11px] leading-snug text-zinc-700 sm:-translate-x-2 sm:max-w-[40%] sm:text-xs sm:leading-tight md:text-sm lg:-translate-x-3">
                {headerSloganLines[0]}
                <br />
                {headerSloganLines[1]}
              </p>
              <Link
                href="/"
                className="absolute left-1/2 top-1/2 z-[2] flex -translate-x-1/2 -translate-y-1/2"
                aria-label="На главную"
              >
                <Logo />
              </Link>
              <div className="ml-auto flex shrink-0 translate-x-1 flex-col items-end gap-1.5 sm:flex-row sm:translate-x-2 sm:items-center sm:gap-2 lg:translate-x-3">
                <Link
                  href="/account"
                  className="glass-subtle shrink-0 rounded-2xl border border-white/45 px-2.5 py-1.5 text-center text-[10px] font-semibold leading-tight text-zinc-900 shadow-sm transition hover:bg-white/45 sm:px-3 sm:text-xs sm:leading-normal md:px-4 md:py-2 md:text-sm"
                >
                  Личный кабинет
                </Link>
                <a
                  href="https://t.me/porodacosmetics"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-2xl bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800 sm:px-4 sm:py-2 sm:text-sm"
                >
                  Telegram
                </a>
              </div>
            </div>
            {/* Одна тёмная линия на всю ширину контейнера (вместо двух бледных border-t) */}
            <div className="w-full shrink-0 border-t-2 border-zinc-900/25" aria-hidden />

            {/* Десктоп: меню под линией */}
            <div className="hidden min-h-0 shrink-0 items-center justify-center pt-1 pb-0.5 lg:flex">
              <nav className="flex flex-wrap justify-center gap-1 sm:gap-2" ref={dropdownRef}>
                {mainNav.map((n) =>
                  n.hasDropdown && "dropdownType" in n ? (
                    <div
                      key={n.href}
                      className="relative"
                      onMouseEnter={() => setOpenDropdown(n.dropdownType as "catalog" | "about")}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      <Link
                        href={n.href}
                        className={navDropdownLinkClass}
                        aria-haspopup="true"
                        aria-expanded={openDropdown === n.dropdownType}
                      >
                        {n.label}
                      </Link>
                      {openDropdown === n.dropdownType && "dropdownLinks" in n && (
                        <div className="absolute left-1/2 top-full z-[100] -translate-x-1/2 pt-1">
                          <div className="liquidGlass-dock min-w-[220px] rounded-2xl border border-white/40 p-2 shadow-lg space-y-0.5">
                            {(n.dropdownLinks as { href: string; label: string }[]).map((link) => (
                              <Link key={link.href} href={link.href} className={dropdownItemClass}>
                                {link.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link key={n.href} href={n.href} className={navPlainClass}>
                      {n.label}
                    </Link>
                  )
                )}
              </nav>
            </div>
          </div>

          {/* Мобилка: та же линия сверху уже есть; второй border не дублируем */}
          <div ref={mobileNavRef} className="relative lg:hidden">
            <nav
              className="flex flex-wrap justify-center gap-2 py-2.5"
              aria-label="Меню"
            >
              <button
                type="button"
                onClick={() => setMobileOpen((m) => (m === "catalog" ? null : "catalog"))}
                className={`${mobileDropdownBtnClass} ${mobileOpen === "catalog" ? "ring-2 ring-zinc-900/25 decoration-zinc-900" : ""}`}
                aria-expanded={mobileOpen === "catalog"}
                aria-haspopup="true"
              >
                Вся продукция
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen((m) => (m === "about" ? null : "about"))}
                className={`${mobileDropdownBtnClass} ${mobileOpen === "about" ? "ring-2 ring-zinc-900/25 decoration-zinc-900" : ""}`}
                aria-expanded={mobileOpen === "about"}
                aria-haspopup="true"
              >
                О нас
              </button>
              <Link
                href="/faq"
                onClick={() => setMobileOpen(null)}
                className="glass-subtle shrink-0 rounded-xl border border-white/45 px-3.5 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-white/45"
              >
                FAQ
              </Link>
              <Link
                href="/partners"
                onClick={() => setMobileOpen(null)}
                className="glass-subtle shrink-0 rounded-xl border border-white/45 px-3.5 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-white/45"
              >
                Партнёрам
              </Link>
            </nav>

            {mobileOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-[100] cursor-default bg-transparent"
                  aria-label="Закрыть меню"
                  onClick={() => setMobileOpen(null)}
                />
                {/* fixed + центр: как выпадашка на ПК, страница не сдвигается */}
                <div
                  className="fixed left-1/2 top-[max(5.25rem,env(safe-area-inset-top,0px)+4.5rem)] z-[110] w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 sm:max-w-md"
                  role="menu"
                >
                  <div className="liquidGlass-dock max-h-[min(70vh,calc(100dvh-7rem))] overflow-y-auto rounded-2xl border border-white/40 p-2 shadow-xl space-y-1">
                    {(mobileOpen === "catalog" ? catalogFilterLinks : aboutDropdownLinks).map((link) => (
                      <Link
                        key={link.href + link.label}
                        href={link.href}
                        role="menuitem"
                        className={`${dropdownItemClass} px-2 py-2.5 active:opacity-70`}
                        onClick={() => setMobileOpen(null)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </Container>
      </div>
    </header>
  );
}
