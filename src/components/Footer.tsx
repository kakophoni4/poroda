"use client";

import Container from "./Container";
import { useSiteCopy } from "@/context/SiteCopyContext";

const linkClass =
  "block rounded-md py-0.5 text-sm leading-snug text-zinc-700 transition hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-400";
const headingClass = "text-sm font-semibold leading-none text-zinc-900";

export default function Footer() {
  const t = useSiteCopy();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-6 sm:mt-8">
      <Container>
        <div className="liquidGlass-dock rounded-2xl border border-white/40 px-4 py-6 sm:rounded-3xl sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-5 lg:grid-cols-4 lg:gap-x-10 lg:gap-y-0">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className={headingClass}>{t("footer.brand")}</div>
            </div>

            <nav className="min-w-0 flex flex-col gap-1.5" aria-label={t("footer.sections_title")}>
              <div className={`${headingClass} mb-0.5`}>{t("footer.sections_title")}</div>
              <a className={linkClass} href="/catalog">
                {t("footer.link_products")}
              </a>
              <a className={linkClass} href="/blog">
                {t("footer.link_blog")}
              </a>
              <a className={linkClass} href="/faq">
                {t("footer.link_faq")}
              </a>
              <a className={linkClass} href="/delivery">
                {t("footer.link_delivery")}
              </a>
            </nav>

            <nav className="min-w-0 flex flex-col gap-1.5" aria-label={t("footer.docs_title")}>
              <div className={`${headingClass} mb-0.5`}>{t("footer.docs_title")}</div>
              <a className={linkClass} href="/legal/privacy">
                {t("footer.link_privacy")}
              </a>
              <a className={linkClass} href="/legal/offer">
                {t("footer.link_offer")}
              </a>
              <a className={linkClass} href="/legal/terms">
                {t("footer.link_terms")}
              </a>
            </nav>

            <div className="flex min-w-0 flex-col gap-1.5 border-t border-white/30 pt-5 sm:col-span-2 sm:border-t-0 sm:pt-0 lg:col-span-1 lg:border-t-0 lg:pt-0">
              <div className={`${headingClass} mb-0.5`}>{t("footer.contacts_title")}</div>
              <a className={linkClass} href="mailto:hello@porodacosmetics.ru">
                hello@porodacosmetics.ru
              </a>
              <a className={linkClass} href="tel:+79084838717">
                +7 908 483-87-17
              </a>
              <a
                className="glass-subtle mt-2 inline-flex w-full max-w-xs items-center justify-center rounded-2xl border border-white/45 px-4 py-2.5 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-white/45 sm:w-auto sm:self-start"
                href="/contacts"
              >
                {t("footer.contact_cta")}
              </a>
              <a
                className="mt-2 block border-t border-white/25 pt-3 text-xs leading-snug text-zinc-600 hover:text-zinc-800"
                href="/admin"
              >
                {t("footer.admin_link")}
              </a>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 pt-4 text-xs leading-relaxed text-zinc-600 sm:pt-5">
          <div>
            © {year} {t("footer.copyright_line1")}
          </div>
          <div>{t("footer.copyright_line2")}</div>
        </div>
      </Container>
    </footer>
  );
}
