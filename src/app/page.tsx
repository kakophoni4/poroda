import Container from "@/components/Container";
import HomeConcernsCarousel from "@/components/HomeConcernsCarousel";
import HomeFeaturedCarousel from "@/components/HomeFeaturedCarousel";
import HomePromoBanners from "@/components/HomePromoBanners";
import PageShell from "@/components/PageShell";
import { getAllProductsForHome } from "@/lib/featured-products";
import { getActiveHomeArticles } from "@/lib/home-articles";
import { getActiveHomeConcernCards } from "@/lib/home-concern-cards";
import { FALLBACK_HOME_ARTICLES, FALLBACK_HOME_CONCERN_CARDS } from "@/lib/home-page-fallbacks";
import { getActiveHomePromoBanners } from "@/lib/home-promo-banners";
import { getSiteCopyMap } from "@/lib/site-copy-server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const copy = await getSiteCopyMap();
  const [promoBanners, concernCards, homeProducts, articles] = await Promise.all([
    getActiveHomePromoBanners(),
    getActiveHomeConcernCards(),
    getAllProductsForHome(),
    getActiveHomeArticles(),
  ]);

  const concernCardsToShow = concernCards.length > 0 ? concernCards : FALLBACK_HOME_CONCERN_CARDS;
  const articlesToShow = articles.length > 0 ? articles : FALLBACK_HOME_ARTICLES;
  const randomArticle =
    articlesToShow.length > 0 ? articlesToShow[Math.floor(Math.random() * articlesToShow.length)] : null;

  return (
    <PageShell>
      <HomePromoBanners banners={promoBanners} />
      <Container>
        <HomeConcernsCarousel cards={concernCardsToShow} title={copy["home.concerns_carousel_title"]} />

        {/* HERO: фото слева на всю высоту текста; на мобилке кнопки — отдельная строка на всю ширину (по центру) */}
        <section className="mt-6 opacity-0 animate-fade-in-up sm:mt-8">
          <div className="grid grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] items-stretch gap-3 sm:grid-cols-[minmax(0,0.45fr)_minmax(0,1fr)] sm:gap-6 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:gap-8 lg:gap-10 xl:gap-12">
            <div className="liquidGlass-dock relative h-full min-h-[min(100%,200px)] w-full overflow-hidden rounded-2xl border border-white/40 shadow-sm sm:min-h-[min(100%,240px)] sm:rounded-3xl md:min-h-0">
              <img
                src="/images/obshchie/hero.jpg"
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div className="flex min-w-0 flex-col justify-center pl-1 text-left sm:pl-2 md:pl-2 xl:pl-6">
              <h1 className="text-balance text-[1.4rem] font-bold leading-[1.15] tracking-tight text-zinc-900 min-[400px]:text-[1.55rem] sm:text-3xl sm:leading-[1.12] md:text-4xl lg:text-[2.35rem] lg:leading-tight xl:text-5xl">
                {copy["home.hero.title"]}
              </h1>
              <div className="mt-3 space-y-3 border-l-[3px] border-zinc-900/15 pl-3 sm:mt-7 sm:space-y-4 sm:pl-4 md:pl-6">
                <p className="text-sm font-semibold leading-snug text-zinc-800 sm:text-lg sm:leading-snug md:text-xl">
                  {copy["home.hero.subtitle_lead"]}
                </p>
                <p className="max-w-xl text-[13px] leading-relaxed text-zinc-600 sm:text-[15px] sm:leading-relaxed md:text-base">
                  {copy["home.hero.subtitle"]}
                </p>
              </div>
              <div className="mt-8 hidden flex-row flex-wrap gap-3 md:mt-10 md:flex">
                <a
                  href="/catalog"
                  className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
                >
                  {copy["home.hero.cta_primary"]}
                </a>
                <a
                  href="/about"
                  className="glass-subtle inline-flex items-center justify-center rounded-2xl border border-white/45 px-6 py-3 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-white/45"
                >
                  {copy["home.hero.cta_secondary"]}
                </a>
              </div>
            </div>
            <div className="col-span-2 mt-2 flex w-full flex-col items-center gap-2.5 md:hidden sm:mt-3">
              <a
                href="/catalog"
                className="inline-flex w-full max-w-sm items-center justify-center rounded-2xl bg-zinc-900 px-5 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-zinc-800 sm:px-6 sm:py-3 sm:text-sm"
              >
                {copy["home.hero.cta_primary"]}
              </a>
              <a
                href="/about"
                className="glass-subtle inline-flex w-full max-w-sm items-center justify-center rounded-2xl border border-white/45 px-5 py-2.5 text-xs font-medium text-zinc-900 shadow-sm transition hover:bg-white/45 sm:px-6 sm:py-3 sm:text-sm"
              >
                {copy["home.hero.cta_secondary"]}
              </a>
            </div>
          </div>
        </section>

        {/* Рекомендуемое — карусель, 3 карточки в ряд, листание по одной */}
        <HomeFeaturedCarousel products={homeProducts} />

        {/* Сноска в блог + одна случайная статья при каждой загрузке */}
        <section className="mt-10 sm:mt-12">
          <div className="liquidGlass-dock rounded-3xl border border-white/40 p-6 text-center sm:p-8">
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-zinc-700">{copy["home.blog_teaser_intro"]}</p>
            <Link
              href="/blog"
              className="glass-subtle mt-4 inline-flex rounded-2xl border border-white/45 px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-white/45"
            >
              {copy["home.blog_teaser_cta"]}
            </Link>
            {randomArticle ? (
              <div className="mt-6 border-t border-white/35 pt-6">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {copy["home.blog_teaser_sample_label"]}
                </p>
                <a
                  href={randomArticle.linkUrl || "#"}
                  className="group liquidGlass-dock mx-auto mt-3 block max-w-lg rounded-2xl border border-white/40 p-5 text-center transition hover:border-white/55 sm:rounded-3xl sm:p-6"
                >
                  <div className="text-base font-semibold group-hover:underline">{randomArticle.title}</div>
                  {randomArticle.description ? (
                    <div className="mt-2 text-sm text-zinc-700">{randomArticle.description}</div>
                  ) : null}
                </a>
              </div>
            ) : null}
          </div>
        </section>

        {/* SERVICE BLOCKS */}
        <section className="mt-16">
          <div className="liquidGlass-dock rounded-3xl border border-white/40 p-6 text-center">
            <div className="text-base font-semibold">{copy["home.faq_teaser_title"]}</div>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-zinc-700">
              {copy["home.faq_teaser_text"]}
            </p>
            <a
              href="/faq"
              className="glass-subtle mt-4 inline-flex rounded-2xl border border-white/45 px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-white/45"
            >
              {copy["home.faq_teaser_cta"]}
            </a>
          </div>
        </section>
      </Container>
    </PageShell>
  );
}
