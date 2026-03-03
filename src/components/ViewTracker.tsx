"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ViewTracker({ productId }: { productId?: string }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const isProductPage = /^\/catalog\/[^/]+$/.test(pathname);
    if (isProductPage) return;
    fetch("/api/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, productId: null }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
