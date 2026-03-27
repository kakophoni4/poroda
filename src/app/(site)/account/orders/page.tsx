import { Suspense } from "react";
import AccountOrdersClient from "./AccountOrdersClient";

export default function AccountOrdersPage() {
  return (
    <Suspense fallback={<div className="liquidGlass-dock mt-8 h-48 animate-pulse rounded-3xl border border-white/40" />}>
      <AccountOrdersClient />
    </Suspense>
  );
}
