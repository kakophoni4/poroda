import { Suspense } from "react";
import Container from "@/components/Container";
import PageShell from "@/components/PageShell";
import ThanksClient from "./ThanksClient";

export default function OrderThanksPage() {
  return (
    <PageShell>
      <Container className="max-w-xl">
        <Suspense
          fallback={<div className="liquidGlass-dock mt-8 h-64 animate-pulse rounded-3xl border border-white/40" />}
        >
          <ThanksClient />
        </Suspense>
      </Container>
    </PageShell>
  );
}
