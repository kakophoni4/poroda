"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { SITE_COPY_DEFAULTS_MAP } from "@/lib/site-copy-schema";

const SiteCopyContext = createContext<Record<string, string>>(SITE_COPY_DEFAULTS_MAP);

export function SiteCopyProvider({
  map,
  children,
}: {
  map: Record<string, string>;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ ...SITE_COPY_DEFAULTS_MAP, ...map }), [map]);
  return <SiteCopyContext.Provider value={value}>{children}</SiteCopyContext.Provider>;
}

/** Текст по ключу из схемы (`header.slogan_line1` и т.д.). */
export function useSiteCopy() {
  const full = useContext(SiteCopyContext);
  return useCallback((key: string) => full[key] ?? SITE_COPY_DEFAULTS_MAP[key] ?? key, [full]);
}
