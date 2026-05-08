import Container from "@/components/Container";
import PageShell from "@/components/PageShell";
import { sanitizeRichHtml, sanitizeText } from "@/lib/sanitize";
import { getSiteCopyMap } from "@/lib/site-copy-server";

function RichBlock({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(html) }}
    />
  );
}

const richIntroClass =
  "text-base leading-relaxed text-zinc-700 sm:text-lg sm:leading-loose [&_a]:font-medium [&_a]:text-zinc-900 [&_a]:underline [&_a]:underline-offset-2";
const richCardClass =
  "text-sm leading-relaxed text-zinc-700 [&_a]:font-medium [&_a]:text-zinc-900 [&_a]:underline [&_a]:underline-offset-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0";

export default async function DeliveryPage() {
  const copy = await getSiteCopyMap();

  const title = sanitizeText(copy["delivery.title"] ?? "", 200);
  const cards = [
    { titleKey: "delivery.courier_title" as const, bodyKey: "delivery.courier_text" as const },
    { titleKey: "delivery.pickup_title" as const, bodyKey: "delivery.pickup_text" as const },
    { titleKey: "delivery.timing_title" as const, bodyKey: "delivery.timing_text" as const },
    { titleKey: "delivery.payment_title" as const, bodyKey: "delivery.payment_text" as const },
    { titleKey: "delivery.returns_title" as const, bodyKey: "delivery.returns_text" as const },
    { titleKey: "delivery.contact_title" as const, bodyKey: "delivery.contact_text" as const },
  ];

  return (
    <PageShell>
      <Container className="max-w-5xl">
        <header className="pt-2 text-center sm:pt-4">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">{title}</h1>
        </header>

        <div className="animate-expand-block mt-8 sm:mt-10">
          <div className="liquidGlass-dock rounded-3xl border border-white/40 p-6 sm:p-8">
            <RichBlock html={copy["delivery.intro"] ?? ""} className={richIntroClass} />
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2">
          {cards.map((c) => (
            <article
              key={c.bodyKey}
              className="rounded-2xl border border-zinc-200/90 bg-white/80 p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h2 className="text-base font-semibold text-zinc-900">{sanitizeText(copy[c.titleKey] ?? "", 300)}</h2>
              <RichBlock html={copy[c.bodyKey] ?? ""} className={`${richCardClass} mt-3`} />
            </article>
          ))}
        </div>
      </Container>
    </PageShell>
  );
}
