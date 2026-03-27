import { Suspense } from "react";
import AccountNotificationsClient from "./AccountNotificationsClient";

export default function AccountNotificationsPage() {
  return (
    <Suspense fallback={<div className="liquidGlass-dock mt-8 h-40 animate-pulse rounded-3xl border border-white/40" />}>
      <AccountNotificationsClient />
    </Suspense>
  );
}
