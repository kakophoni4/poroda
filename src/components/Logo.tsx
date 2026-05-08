"use client";

import Image from "next/image";
import { useState } from "react";
import { BRAND_LOGO_PATH } from "@/lib/brand";

const FALLBACK = (
  <div className="flex items-center gap-2">
    <div className="h-9 w-9 rounded-2xl bg-zinc-900" />
    <div className="leading-tight">
      <div className="text-sm font-semibold tracking-wide">PORODA</div>
      <div className="text-[11px] text-zinc-500">cosmetics</div>
    </div>
  </div>
);

const WRAPPER: Record<"header" | "footer" | "admin", string> = {
  header: "inline-flex h-9 max-w-[min(200px,55vw)] items-center sm:max-w-[240px]",
  footer: "inline-flex h-8 max-w-[200px] items-center",
  admin: "inline-flex h-8 max-w-[180px] items-center",
};

export default function Logo({ variant = "header" }: { variant?: "header" | "footer" | "admin" }) {
  const [failed, setFailed] = useState(false);
  if (failed) return FALLBACK;

  return (
    <span className={WRAPPER[variant]}>
      <Image
        src={BRAND_LOGO_PATH}
        alt="PORODA Cosmetics"
        width={320}
        height={96}
        className="max-h-full w-auto max-w-full object-contain object-left"
        priority={variant === "header"}
        onError={() => setFailed(true)}
      />
    </span>
  );
}
