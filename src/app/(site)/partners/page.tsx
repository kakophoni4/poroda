import Container from "@/components/Container";
import PageShell from "@/components/PageShell";

export default function PartnersPage() {
  return (
    <PageShell>
      <Container>
        <h1 className="text-3xl font-semibold">Партнёрам</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-700">
          Раздел для опта/салонов/совместных проектов. Добавим условия и форму заявки.
        </p>
      </Container>
    </PageShell>
  );
}
