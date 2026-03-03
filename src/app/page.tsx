import Container from "@/components/Container";
import PageShell from "@/components/PageShell";
import SectionTitle from "@/components/SectionTitle";
import { getFeaturedProducts } from "@/lib/featured-products";
import { homeData } from "@/lib/site-data";
import Link from "next/link";

function HeroImage() {
  return (
    <div className="liquidGlass-dock relative aspect-[4/3] min-h-[260px] overflow-hidden rounded-3xl border border-white/40">
      {/* После node scripts/copy-poroda-photos.js в public/images/obshchie появится hero.jpg */}
      <img
        src="/images/obshchie/hero.jpg"
        alt=""
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="liquid-glass glass-btn inline-flex items-center rounded-full px-3 py-1 text-xs text-zinc-700">
      {children}
    </span>
  );
}

async function FeaturedProductsSection() {
  const products = await getFeaturedProducts();
  if (products.length === 0) return null;
  return (
    <section className="mt-16">
      <SectionTitle title="Рекомендуемое" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/catalog/${p.slug}`}
            className="liquidGlass-dock group rounded-3xl border border-white/40 overflow-hidden"
          >
            <div className="aspect-square overflow-hidden rounded-t-3xl bg-zinc-100">
              <img
                src={p.imageUrl}
                alt=""
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <div className="p-5">
              <div className="text-sm font-semibold text-zinc-900">{p.title}</div>
              {p.shortDesc && (
                <div className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-600">{p.shortDesc}</div>
              )}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-medium">{p.priceFormatted}</span>
                <span className="rounded-2xl bg-zinc-900 px-4 py-2 text-xs font-medium text-white">
                  Подробнее
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { hero, benefits, concerns, steps, blogTeasers } = homeData;

  return (
    <PageShell>
      <Container>
        {/* HERO */}
        <section className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6 opacity-0 animate-fade-in-up">
            <div className="flex flex-wrap gap-2">
              <Pill>Профессиональный уход</Pill>
              <Pill>Под задачи кожи</Pill>
              <Pill>Каталог с фото</Pill>
            </div>

            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              {hero.title}
            </h1>
            <p className="text-base leading-relaxed text-zinc-700 sm:text-lg">
              {hero.subtitle}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="/catalog"
                className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800"
              >
                {hero.primaryCta}
              </a>
              <a
                href="/faq"
                className="liquid-glass glass-btn inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium text-zinc-900"
              >
                {hero.secondaryCta}
              </a>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              {benefits.map((b) => (
                <div
                  key={b.title}
                  className="liquidGlass-dock rounded-3xl border border-white/40 p-4"
                >
                  <div className="text-sm font-medium">{b.title}</div>
                  <div className="mt-1 text-xs leading-relaxed text-zinc-600">{b.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:pl-6 opacity-0 animate-fade-in-up animation-delay-100">
            <HeroImage />
          </div>
        </section>

        {/* CONCERNS */}
        <section className="mt-16 opacity-0 animate-fade-in-up animation-delay-200">
          <SectionTitle title="Выберите вашу проблему" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {concerns.map((c) => (
              <a
                key={c}
                href="/catalog"
                className="liquidGlass-dock group rounded-3xl border border-white/40 p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-zinc-900">{c}</div>
                  <div className="text-xs text-zinc-500 group-hover:text-zinc-700">Открыть →</div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* FEATURED PRODUCTS */}
        <FeaturedProductsSection />

        {/* STEPS */}
        <section className="mt-16">
          <SectionTitle title="Советы по подбору ухода" />
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {steps.map((s, idx) => (
              <div key={s.title} className="liquidGlass-dock rounded-3xl border border-white/40 p-6">
                <div className="glass-subtle mb-3 inline-flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-semibold">
                  {idx + 1}
                </div>
                <div className="text-base font-semibold">{s.title}</div>
                <div className="mt-1 text-sm leading-relaxed text-zinc-700">{s.text}</div>
              </div>
            ))}
          </div>
        </section>

        {/* BLOG TEASERS */}
        <section className="mt-16">
          <SectionTitle title="Наши статьи" />
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {blogTeasers.map((b) => (
              <a
                key={b.title}
                href="/blog"
                className="liquidGlass-dock group rounded-3xl border border-white/40 p-6"
              >
                <div className="text-xs text-zinc-500">{b.tag}</div>
                <div className="mt-2 text-base font-semibold group-hover:underline">{b.title}</div>
                <div className="mt-2 text-sm text-zinc-700">{b.text}</div>
              </a>
            ))}
          </div>
        </section>

        {/* SERVICE BLOCKS */}
        <section className="mt-16">
          <div className="liquidGlass-dock rounded-3xl border border-white/40 p-6">
            <div className="text-base font-semibold">FAQ и сочетания</div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              Короткие ответы про использование, порядок нанесения, сочетания активов.
            </p>
            <a
              href="/faq"
              className="liquid-glass glass-btn mt-4 inline-flex rounded-2xl px-4 py-2 text-sm font-medium"
            >
              Перейти в FAQ
            </a>
          </div>
        </section>
      </Container>
    </PageShell>
  );
}
