import AboutSubnav from "@/components/AboutSubnav";
import Container from "@/components/Container";
import PageShell from "@/components/PageShell";
import SectionTitle from "@/components/SectionTitle";
import { getActiveHomeArticles } from "@/lib/home-articles";
import { FALLBACK_HOME_ARTICLES } from "@/lib/home-page-fallbacks";
import { getSiteCopyMap } from "@/lib/site-copy-server";

export default async function BlogPage() {
  const [copy, articles] = await Promise.all([getSiteCopyMap(), getActiveHomeArticles()]);
  const list = articles.length > 0 ? articles : FALLBACK_HOME_ARTICLES;

  return (
    <PageShell>
      <Container>
        <AboutSubnav activeHref="/blog" />

        <div className="mt-6 sm:mt-8">
          <SectionTitle title={copy["home.articles_title"]} />
        </div>

        <div className="mt-6 grid gap-4 sm:mt-8 lg:grid-cols-3">
          {list.map((a) => (
            <a
              key={a.id}
              href={a.linkUrl || "#"}
              className="liquidGlass-dock group rounded-3xl border border-white/40 p-6 text-center"
            >
              <div className="text-base font-semibold group-hover:underline">{a.title}</div>
              {a.description ? <div className="mt-2 text-sm text-zinc-700">{a.description}</div> : null}
            </a>
          ))}
        </div>
      </Container>
    </PageShell>
  );
}
