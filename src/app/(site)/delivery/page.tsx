import Container from "@/components/Container";
import PageShell from "@/components/PageShell";

export default function DeliveryPage() {
  return (
    <PageShell>
      <Container>
        <h1 className="text-3xl font-semibold">Доставка и оплата</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-700">
          Здесь будут сроки, стоимость, способы оплаты и условия возврата.
        </p>
      </Container>
    </PageShell>
  );
}
