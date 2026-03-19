import Container from "@/components/Container";
import PageShell from "@/components/PageShell";

export default function DeliveryPage() {
  return (
    <PageShell>
      <Container>
        <h1 className="text-3xl font-semibold">Доставка и оплата</h1>
        <div className="liquidGlass-dock mt-6 max-w-2xl rounded-3xl border border-white/40 p-6 sm:p-8">
          <p className="text-sm leading-relaxed text-zinc-700">
            Здесь будут сроки, стоимость, способы оплаты и условия возврата.
          </p>
        </div>
      </Container>
    </PageShell>
  );
}
