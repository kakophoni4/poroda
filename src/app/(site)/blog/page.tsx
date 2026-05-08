import AboutSubnav from "@/components/AboutSubnav";
import Container from "@/components/Container";
import PageShell from "@/components/PageShell";
import SectionTitle from "@/components/SectionTitle";
import type { HomeArticlePublic } from "@/lib/home-articles";
import { getActiveHomeArticles } from "@/lib/home-articles";
import { FALLBACK_HOME_ARTICLES } from "@/lib/home-page-fallbacks";
import { getSiteCopyMap } from "@/lib/site-copy-server";
import Link from "next/link";

const cardClassName =
  "liquidGlass-dock group rounded-3xl border border-white/40 p-6 text-center";

function BlogArticleCard({ article }: { article: HomeArticlePublic }) {
  const href = article.linkUrl?.trim() || "/blog";
  const isInternal = href.startsWith("/") && !href.startsWith("//");
  const inner = (
    <>
      <div className="text-base font-semibold group-hover:underline">{article.title}</div>
      {article.description ? <div className="mt-2 text-sm text-zinc-700">{article.description}</div> : null}
    </>
  );
  if (isInternal) {
    return (
      <Link href={href} className={cardClassName}>
        {inner}
      </Link>
    );
  }
  return (
    <a
      href={href}
      className={cardClassName}
      {...(href.startsWith("http")
        ? { target: "_blank" as const, rel: "noopener noreferrer" as const }
        : {})}
    >
      {inner}
    </a>
  );
}

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
            <BlogArticleCard key={a.id} article={a} />
          ))}
        </div>
      </Container>
    </PageShell>
  );
}
