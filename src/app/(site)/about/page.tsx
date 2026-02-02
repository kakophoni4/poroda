import Container from "@/components/Container";
import PageShell from "@/components/PageShell";

export default function AboutPage() {
  return (
    <PageShell>
      <Container>
        <h1 className="text-3xl font-semibold">О бренде</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-700">
          Здесь будет история бренда, подход, ценности и ответы “почему вам можно доверять”.
        </p>
      </Container>
    </PageShell>
  );
}
