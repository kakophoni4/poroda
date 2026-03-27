import { Suspense } from "react";
import AccountDiscountsClient from "./AccountDiscountsClient";

export default function AccountDiscountsPage() {
  return (
    <Suspense fallback={<div className="liquidGlass-dock mt-8 h-48 animate-pulse rounded-3xl border border-white/40" />}>
      <AccountDiscountsClient />
    </Suspense>
  );
}
