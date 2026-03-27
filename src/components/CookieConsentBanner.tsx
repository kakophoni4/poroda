"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSiteCopy } from "@/context/SiteCopyContext";

/** > 0 — пользователь уже нажал «Принять» (раньше сохраняли номер визита, теперь достаточно флага) */
const COOKIE_ACCEPT_AT_KEY = "poroda_cookie_accept_at_visit";

function hasAcceptedCookies(): boolean {
  const v = parseInt(
    typeof window !== "undefined" ? window.localStorage.getItem(COOKIE_ACCEPT_AT_KEY) || "0" : "0",
    10,
  );
  return v > 0;
}

export default function CookieConsentBanner() {
  const t = useSiteCopy();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (typeof window === "undefined") return;
    setVisible(!hasAcceptedCookies());
  }, [pathname]);

  const accept = () => {
    window.localStorage.setItem(COOKIE_ACCEPT_AT_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
      role="dialog"
      aria-label={t("cookie.dialog_aria")}
    >
      <div className="pointer-events-auto liquidGlass-dock max-w-lg rounded-2xl border border-white/50 px-4 py-3 shadow-lg sm:max-w-2xl sm:px-5 sm:py-4">
        <p className="text-sm leading-snug text-zinc-800">
          {t("cookie.text_before")}{" "}
          <Link href="/legal/privacy" className="font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-700">
            {t("cookie.privacy_link")}
          </Link>
          .
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={accept}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-zinc-800 active:scale-[0.99]"
          >
            {t("cookie.accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
