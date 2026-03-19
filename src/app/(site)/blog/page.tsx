import AboutSubnav from "@/components/AboutSubnav";
import Container from "@/components/Container";
import PageShell from "@/components/PageShell";

export default function BlogPage() {
  return (
    <PageShell>
      <Container>
        <AboutSubnav activeHref="/blog" />

        <div className="mt-8 grid gap-4 sm:mt-10 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="liquidGlass-dock rounded-3xl border border-white/40 p-6 text-left">
              <div className="text-xs text-zinc-500">Скоро</div>
              <div className="mt-2 text-base font-semibold text-zinc-900">Материал #{i}</div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                Мы опубликуем для вас статьи для изучения
              </p>
            </div>
          ))}
        </div>
      </Container>
    </PageShell>
  );
}
