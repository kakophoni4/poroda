import Container from "@/components/Container";
import HomeConcernsCarousel from "@/components/HomeConcernsCarousel";
import HomeFeaturedCarousel from "@/components/HomeFeaturedCarousel";
import HomePromoBanners from "@/components/HomePromoBanners";
import PageShell from "@/components/PageShell";
import QuizPopup from "@/components/QuizPopup";
import SectionTitle from "@/components/SectionTitle";
import { getAllProductsForHome } from "@/lib/featured-products";
import { getActiveHomeArticles } from "@/lib/home-articles";
import { getActiveHomeConcernCards } from "@/lib/home-concern-cards";
import { FALLBACK_HOME_ARTICLES, FALLBACK_HOME_CONCERN_CARDS } from "@/lib/home-page-fallbacks";
import { getActiveHomePromoBanners } from "@/lib/home-promo-banners";
import { homeData } from "@/lib/site-data";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { hero } = homeData;
  const [promoBanners, concernCards, homeProducts, articles] = await Promise.all([
    getActiveHomePromoBanners(),
    getActiveHomeConcernCards(),
    getAllProductsForHome(),
    getActiveHomeArticles(),
  ]);

  const concernCardsToShow = concernCards.length > 0 ? concernCards : FALLBACK_HOME_CONCERN_CARDS;
  const articlesToShow = articles.length > 0 ? articles : FALLBACK_HOME_ARTICLES;

  return (
    <PageShell>
      <HomePromoBanners banners={promoBanners} />
      <Container>
        <HomeConcernsCarousel cards={concernCardsToShow} title="С какой проблемой вы столкнулись?" />

        {/* HERO: фото строго слева, текст справа */}
        <section className="mt-6 opacity-0 animate-fade-in-up sm:mt-8">
          {/* С мобилки: фото слева, текст справа (две колонки) */}
          <div className="grid grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] items-stretch gap-3 sm:grid-cols-[minmax(0,0.45fr)_minmax(0,1fr)] sm:gap-6 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:gap-8 lg:gap-10 xl:gap-12">
            <div className="liquidGlass-dock relative min-h-[min(100%,220px)] overflow-hidden rounded-2xl border border-white/40 shadow-sm sm:min-h-[260px] sm:rounded-3xl md:min-h-0">
              <img
                src="/images/obshchie/hero.jpg"
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div className="flex min-w-0 flex-col justify-center pl-1 text-left sm:pl-2 md:pl-2 xl:pl-6">
              <h1 className="text-balance text-[1.4rem] font-bold leading-[1.15] tracking-tight text-zinc-900 min-[400px]:text-[1.55rem] sm:text-3xl sm:leading-[1.12] md:text-4xl lg:text-[2.35rem] lg:leading-tight xl:text-5xl">
                {hero.title}
              </h1>
              <div className="mt-3 space-y-3 border-l-[3px] border-zinc-900/15 pl-3 sm:mt-7 sm:space-y-4 sm:pl-4 md:pl-6">
                <p className="text-sm font-semibold leading-snug text-zinc-800 sm:text-lg sm:leading-snug md:text-xl">
                  {hero.subtitleLead}
                </p>
                <p className="max-w-xl text-[13px] leading-relaxed text-zinc-600 sm:text-[15px] sm:leading-relaxed md:text-base">
                  {hero.subtitle}
                </p>
              </div>
              <div className="mt-5 flex flex-col gap-2 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3 md:mt-10">
                <a
                  href="/catalog"
                  className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-4 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-zinc-800 sm:px-6 sm:py-3 sm:text-sm"
                >
                  {hero.primaryCta}
                </a>
                <a
                  href="/about"
                  className="glass-subtle inline-flex items-center justify-center rounded-2xl border border-white/45 px-4 py-2.5 text-xs font-medium text-zinc-900 shadow-sm transition hover:bg-white/45 sm:px-6 sm:py-3 sm:text-sm"
                >
                  {hero.secondaryCta}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Рекомендуемое — карусель, 3 карточки в ряд, листание по одной */}
        <HomeFeaturedCarousel products={homeProducts} />

        {/* Исследования косметологии — статьи с админки */}
        <section className="mt-16">
          <SectionTitle title="Исследования косметологии" />
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {articlesToShow.map((a) => (
              <a
                key={a.id}
                href={a.linkUrl || "#"}
                className="liquidGlass-dock group rounded-3xl border border-white/40 p-6 text-center"
              >
                <div className="text-base font-semibold group-hover:underline">{a.title}</div>
                {a.description && <div className="mt-2 text-sm text-zinc-700">{a.description}</div>}
              </a>
            ))}
          </div>
        </section>

        {/* SERVICE BLOCKS */}
        <section className="mt-16">
          <div className="liquidGlass-dock rounded-3xl border border-white/40 p-6 text-center">
            <div className="text-base font-semibold">Частые вопросы пользователей</div>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-zinc-700">
              Ответы на вопросы, которые задают чаще всего: как пользоваться средствами, в каком порядке наносить, что с чем сочетать.
            </p>
            <a
              href="/faq"
              className="glass-subtle mt-4 inline-flex rounded-2xl border border-white/45 px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-white/45"
            >
              Читать ответы
            </a>
          </div>
        </section>
      </Container>
      <QuizPopup />
    </PageShell>
  );
}
