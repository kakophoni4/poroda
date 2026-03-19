"use client";

import { usePathname } from "next/navigation";

/**
 * Лёгкая «преанимация» при смене маршрута: контент чуть проявляется и поднимается.
 * key=pathname заставляет блок перемонтироваться и заново запускать CSS-анимацию.
 * Админку не трогаем — там отдельный UX.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <div key={pathname} className="animate-page-route-enter">
      {children}
    </div>
  );
}
