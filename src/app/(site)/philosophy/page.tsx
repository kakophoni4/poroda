import Container from "@/components/Container";
import PageShell from "@/components/PageShell";

export default function PhilosophyPage() {
  return (
    <PageShell>
      <Container>
        <h1 className="text-3xl font-semibold">Философия</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-700">
          Раздел про то, как вы подходите к уходу: логика, принципы, как выбирать средства.
        </p>
      </Container>
    </PageShell>
  );
}
