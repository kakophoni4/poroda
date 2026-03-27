"use client";

import { CartProvider } from "@/context/CartContext";
import { SiteCopyProvider } from "@/context/SiteCopyContext";

export default function Providers({
  children,
  siteCopy,
}: {
  children: React.ReactNode;
  siteCopy: Record<string, string>;
}) {
  return (
    <SiteCopyProvider map={siteCopy}>
      <CartProvider>{children}</CartProvider>
    </SiteCopyProvider>
  );
}
