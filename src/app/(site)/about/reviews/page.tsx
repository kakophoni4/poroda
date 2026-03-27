import AboutSubnav from "@/components/AboutSubnav";
import Container from "@/components/Container";
import PageShell from "@/components/PageShell";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

function Stars({ n }: { n: number }) {
  const filled = Math.min(5, Math.max(1, n));
  return (
    <span className="text-amber-500" aria-label={`Оценка ${filled} из 5`}>
      {"★".repeat(filled)}
      <span className="text-zinc-300">{"★".repeat(5 - filled)}</span>
    </span>
  );
}

export default async function AboutReviewsPage() {
  let reviews: {
    id: string;
    authorName: string;
    body: string;
    rating: number;
    imageUrls: string[];
    createdAt: Date;
  }[] = [];
  try {
    reviews = await prisma.customerReview.findMany({
      where: { status: "approved" },
      orderBy: { createdAt: "desc" },
      select: { id: true, authorName: true, body: true, rating: true, imageUrls: true, createdAt: true },
    });
  } catch {
    // БД недоступна
  }

  return (
    <PageShell>
      <Container className="max-w-3xl">
        <AboutSubnav activeHref="/about/reviews" />
        <h1 className="mt-8 text-2xl font-semibold sm:text-3xl">Отзывы покупателей</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Здесь публикуются отзывы клиентов после реальных заказов. После оформления покупки вы можете оставить свой — мы
          проверим текст и начислим промокод −10% на следующий заказ. Есть вопрос? Напишите в разделе{" "}
          <Link href="/faq" className="font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-700">
            FAQ
          </Link>
          .
        </p>

        <section className="mt-10 space-y-4">
          {reviews.length === 0 ? (
            <div className="frost-panel rounded-3xl p-8 text-center text-zinc-600">
              Пока нет опубликованных отзывов — станьте первой, кто поделится впечатлением после заказа.
            </div>
          ) : (
            reviews.map((r) => (
              <article key={r.id} className="frost-panel rounded-3xl p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-zinc-900">{r.authorName}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                    Покупатель PORODA
                  </span>
                </div>
                <div className="mt-1 text-sm">
                  <Stars n={r.rating} />
                </div>
                <p className="mt-4 whitespace-pre-wrap text-zinc-700">{r.body}</p>
                {r.imageUrls?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {r.imageUrls.map((src) => (
                      <a
                        key={src}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block h-24 w-24 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                ) : null}
                <p className="mt-3 text-xs text-zinc-500">
                  {new Date(r.createdAt).toLocaleDateString("ru-RU", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </article>
            ))
          )}
        </section>
      </Container>
    </PageShell>
  );
}
