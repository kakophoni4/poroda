import { Suspense } from "react";
import Link from "next/link";
import AboutSubnav from "@/components/AboutSubnav";
import Container from "@/components/Container";
import OrderReviewClient from "@/components/OrderReviewClient";
import PageShell from "@/components/PageShell";

export default function OrderReviewPage() {
  return (
    <PageShell>
      <Container className="max-w-xl">
        <AboutSubnav activeHref="/about/reviews" />
        <h1 className="mt-8 text-2xl font-semibold sm:text-3xl">Отзыв о заказе</h1>
        <div className="liquidGlass-dock mt-6 rounded-3xl border border-white/40 p-6 sm:p-8">
          <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-white/40" aria-hidden />}>
            <OrderReviewClient />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-zinc-600">
          <Link href="/about/reviews" className="font-medium underline underline-offset-2">
            Все отзывы
          </Link>
        </p>
      </Container>
    </PageShell>
  );
}
