"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Container from "./Container";
import Logo from "./Logo";
import Link from "next/link";
import { useSiteCopy } from "@/context/SiteCopyContext";

/** Пункты верхнего меню: без круглой плашки / «стекла», только текст и пунктир */
const navDropdownLinkClass =
  "inline-flex items-center px-3 py-2 text-base font-medium text-zinc-800 underline decoration-dotted decoration-zinc-500/80 underline-offset-[6px] hover:text-zinc-900 hover:decoration-zinc-800 sm:text-[1.05rem]";
const navPlainClass =
  "px-3 py-2 text-base font-medium text-zinc-800 underline decoration-transparent underline-offset-[6px] hover:text-zinc-900 hover:decoration-zinc-400 sm:text-[1.05rem]";
const mobileDropdownBtnClass =
  "inline-flex shrink-0 items-center px-2.5 py-1.5 text-xs font-semibold text-zinc-800 underline decoration-dotted decoration-zinc-500/80 underline-offset-[4px] transition hover:text-zinc-900 sm:px-3.5 sm:py-2 sm:text-sm sm:underline-offset-[5px]";
const mobileNavLinkClass =
  "shrink-0 whitespace-nowrap px-2.5 py-1.5 text-xs font-medium text-zinc-800 underline decoration-transparent underline-offset-[4px] hover:decoration-zinc-400 sm:px-3.5 sm:py-2 sm:text-sm sm:underline-offset-[5px]";
/** Пункты выпадающих «О нас» / «Вся продукция» — только текст, без плашек */
const dropdownItemClass =
  "block rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 underline decoration-transparent underline-offset-[6px] transition hover:text-zinc-900 hover:decoration-zinc-400";

export default function Header() {
  const t = useSiteCopy();
  const aboutDropdownLinks = useMemo(
    () => [
      { href: "/about", label: t("nav.about_brand") },
      { href: "/philosophy", label: t("nav.about_philosophy") },
      { href: "/about/reviews", label: t("nav.about_reviews") },
      { href: "/blog", label: t("nav.about_blog") },
      { href: "/contacts", label: t("nav.about_contacts") },
    ],
    [t],
  );
  const catalogFilterLinks = useMemo(
    () => [
      { href: "/catalog", label: t("nav.catalog_all") },
      { href: "/catalog?filter=promo", label: t("nav.catalog_promo") },
      { href: "/catalog?filter=new", label: t("nav.catalog_new") },
      { href: "/catalog?filter=bestseller", label: t("nav.catalog_bestseller") },
    ],
    [t],
  );
  type NavEntry =
    | {
        href: string;
        label: string;
        hasDropdown: true;
        dropdownType: "catalog" | "about";
        dropdownLinks: { href: string; label: string }[];
      }
    | { href: string; label: string; hasDropdown: false };

  const mainNav: NavEntry[] = useMemo(
    () => [
      {
        href: "/catalog",
        label: t("nav.catalog_root"),
        hasDropdown: true,
        dropdownType: "catalog",
        dropdownLinks: catalogFilterLinks,
      },
      {
        href: "/about",
        label: t("nav.about_root"),
        hasDropdown: true,
        dropdownType: "about",
        dropdownLinks: aboutDropdownLinks,
      },
      { href: "/faq", label: t("nav.faq"), hasDropdown: false },
      { href: "/partners", label: t("nav.partners"), hasDropdown: false },
    ],
    [t, aboutDropdownLinks, catalogFilterLinks],
  );

  const [openDropdown, setOpenDropdown] = useState<"catalog" | "about" | null>(null);
  const [mobileOpen, setMobileOpen] = useState<"catalog" | "about" | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: Event) {
      const node = e.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(node)) {
        setOpenDropdown(null);
      }
      if (mobileNavRef.current && !mobileNavRef.current.contains(node)) {
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
    <header id="site-header-root" className="relative z-50">
      <div className="liquidGlass-dock w-full overflow-visible border-b border-white/40 shadow-sm">
        <Container className="!px-3 sm:!px-4 lg:!px-6">
          {/* Верх: слоган, лого, кнопки — затем навигация сразу под лого */}
          <div className="flex flex-col gap-0">
            <div className="relative flex min-h-[2.75rem] shrink-0 items-center justify-between gap-2 py-1.5 lg:min-h-[2.5rem] lg:justify-start lg:py-1">
              <p className="z-[1] hidden max-w-[44%] text-left text-[11px] leading-snug text-zinc-700 sm:max-w-[40%] sm:text-xs sm:leading-tight md:text-sm lg:block lg:-translate-x-1 xl:-translate-x-2 2xl:-translate-x-3">
                {t("header.slogan_line1")}
                <br />
                {t("header.slogan_line2")}
              </p>
              <Link
                href="/"
                className="relative z-[2] flex shrink-0 lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2"
                aria-label={t("aria.home")}
              >
                <Logo />
              </Link>
              <div className="flex shrink-0 flex-row items-center gap-2 sm:gap-2 lg:ml-auto lg:translate-x-1 xl:translate-x-2 2xl:translate-x-3">
                <Link
                  href="/account"
                  aria-label={t("header.account")}
                  className="glass-subtle inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-2xl border border-white/45 px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-white/45 lg:min-h-0 lg:min-w-0 lg:px-4 lg:py-2 lg:text-sm"
                >
                  <span className="lg:hidden">ЛК</span>
                  <span className="hidden lg:inline">{t("header.account")}</span>
                </Link>
                <a
                  href="https://t.me/porodacosmetics"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("header.telegram")}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-sm transition hover:bg-zinc-800 lg:h-auto lg:w-auto lg:px-4 lg:py-2"
                >
                  <svg className="h-5 w-5 lg:hidden" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                  <span className="hidden text-sm font-semibold lg:inline">{t("header.telegram")}</span>
                </a>
              </div>
            </div>
            {/* Одна тёмная линия на всю ширину контейнера (вместо двух бледных border-t) */}
            <div className="w-full shrink-0 border-t-2 border-zinc-900/25" aria-hidden />

            {/* Десктоп: меню под линией */}
            <div className="hidden min-h-0 shrink-0 items-center justify-center pt-1 pb-0.5 lg:flex">
              <nav className="flex flex-wrap justify-center gap-1 sm:gap-2" ref={dropdownRef}>
                {mainNav.map((n) =>
                  n.hasDropdown ? (
                    <div
                      key={n.href}
                      className="relative"
                      onMouseEnter={() => setOpenDropdown(n.dropdownType)}
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
                      {openDropdown === n.dropdownType && (
                        <div className="absolute left-1/2 top-full z-[100] -translate-x-1/2 pt-1">
                          <div className="liquidGlass-dock min-w-[220px] rounded-2xl border border-white/40 p-2 shadow-lg space-y-0.5">
                            {n.dropdownLinks.map((link) => (
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
            <div className="-mx-3 overflow-x-auto overscroll-x-contain px-3 py-2 touch-pan-x [scrollbar-width:none] sm:-mx-4 sm:px-4 sm:py-2.5 [&::-webkit-scrollbar]:hidden">
              <nav
                className="mx-auto flex min-w-[100%] w-max max-w-none flex-nowrap items-center justify-center gap-1 sm:gap-1.5"
                aria-label="Меню"
              >
                <button
                  type="button"
                  onClick={() => setMobileOpen((m) => (m === "catalog" ? null : "catalog"))}
                  className={`${mobileDropdownBtnClass} ${mobileOpen === "catalog" ? "ring-2 ring-zinc-900/25 decoration-zinc-900" : ""}`}
                  aria-expanded={mobileOpen === "catalog"}
                  aria-haspopup="true"
                >
                  {t("nav.catalog_root")}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileOpen((m) => (m === "about" ? null : "about"))}
                  className={`${mobileDropdownBtnClass} ${mobileOpen === "about" ? "ring-2 ring-zinc-900/25 decoration-zinc-900" : ""}`}
                  aria-expanded={mobileOpen === "about"}
                  aria-haspopup="true"
                >
                  {t("nav.about_root")}
                </button>
                <Link href="/faq" onClick={() => setMobileOpen(null)} className={mobileNavLinkClass}>
                  {t("nav.faq")}
                </Link>
                <Link href="/partners" onClick={() => setMobileOpen(null)} className={mobileNavLinkClass}>
                  {t("nav.partners")}
                </Link>
              </nav>
            </div>

            {mobileOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-[100] cursor-default bg-transparent"
                  aria-label={t("aria.close_menu")}
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
