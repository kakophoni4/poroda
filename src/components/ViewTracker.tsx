"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { sanitizePageViewReferrer } from "@/lib/sanitize-referrer";

export default function ViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const isProductPage = /^\/catalog\/[^/]+$/.test(pathname);
    if (isProductPage) return;
    const referrer = sanitizePageViewReferrer(typeof document !== "undefined" ? document.referrer : null);
    fetch("/api/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: pathname, ...(referrer != null ? { referrer } : {}) }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
