import Container from "@/components/Container";
import PageShell from "@/components/PageShell";
import SectionTitle from "@/components/SectionTitle";
import { homeData } from "@/lib/site-data";

function PlaceholderImage() {
  return (
    <div className="grid-lines relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,0,0,0.06),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(0,0,0,0.05),transparent_45%)]" />
      <div className="relative flex h-full min-h-[260px] items-end p-6">
        <div className="rounded-2xl border border-zinc-200 bg-white/70 px-4 py-3 backdrop-blur">
          <div className="text-sm text-zinc-700">Здесь будет фото/баннер</div>
          <div className="text-xs text-zinc-500">пока ставим аккуратную заглушку</div>
        </div>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700">
      {children}
    </span>
  );
}

export default function HomePage() {
  const { hero, benefits, concerns, featuredProducts, steps, blogTeasers } = homeData;

  return (
    <PageShell>
      <Container>
        {/* HERO */}
        <section className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Pill>Профессиональный уход</Pill>
              <Pill>Под задачи кожи</Pill>
              <Pill>Без фото — но уже структура</Pill>
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
                className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
              >
                {hero.secondaryCta}
              </a>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              {benefits.map((b) => (
                <div
                  key={b.title}
                  className="rounded-3xl border border-zinc-200 bg-white p-4"
                >
                  <div className="text-sm font-medium">{b.title}</div>
                  <div className="mt-1 text-xs leading-relaxed text-zinc-600">{b.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:pl-6">
            <PlaceholderImage />
          </div>
        </section>

        {/* CONCERNS */}
        <section className="mt-16">
          <SectionTitle title="Выберите задачу" subtitle="Плитки ведут на каталог — даже если он пока заглушка." />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {concerns.map((c) => (
              <a
                key={c}
                href="/catalog"
                className="group rounded-3xl border border-zinc-200 bg-white p-5 hover:bg-zinc-50"
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
        <section className="mt-16">
          <SectionTitle title="Рекомендуемое" subtitle="Карточки без фото, но с живыми названиями — чтобы показать прогресс." />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((p) => (
              <div key={p.title} className="rounded-3xl border border-zinc-200 bg-white p-5">
                <div className="grid-lines mb-4 h-36 rounded-2xl border border-zinc-200 bg-zinc-50" />
                <div className="text-sm font-semibold">{p.title}</div>
                <div className="mt-1 text-xs leading-relaxed text-zinc-600">{p.desc}</div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm font-medium">{p.price}</div>
                  <a
                    href="/catalog"
                    className="rounded-2xl bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800"
                  >
                    Подробнее
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* STEPS */}
        <section className="mt-16">
          <SectionTitle title="Как собрать уход" subtitle="Простой ориентир — потом можно сделать квиз-подбор." />
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {steps.map((s, idx) => (
              <div key={s.title} className="rounded-3xl border border-zinc-200 bg-white p-6">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-semibold">
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
          <SectionTitle title="Материалы" subtitle="Пока заглушки, но раздел уже заложен." />
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {blogTeasers.map((b) => (
              <a
                key={b.title}
                href="/blog"
                className="group rounded-3xl border border-zinc-200 bg-white p-6 hover:bg-zinc-50"
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
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6">
              <div className="text-base font-semibold">FAQ и сочетания</div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                Короткие ответы про использование, порядок нанесения, сочетания активов.
              </p>
              <a
                href="/faq"
                className="mt-4 inline-flex rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
              >
                Перейти в FAQ
              </a>
            </div>
            <div className="rounded-3xl border border-zinc-200 bg-white p-6">
              <div className="text-base font-semibold">Доставка и оплата</div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                Раздел уже есть в структуре — добавим условия и сроки, когда будете готовы.
              </p>
              <a
                href="/delivery"
                className="mt-4 inline-flex rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
              >
                Условия доставки
              </a>
            </div>
          </div>
        </section>

        {/* FOOTNOTE */}
        <section className="mt-16 mb-6 rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
          <div className="text-sm font-medium">Статус</div>
          <div className="mt-1 text-sm text-zinc-700">
            Главная страница готова. Остальные разделы открываются.
          </div>
        </section>
      </Container>
    </PageShell>
  );
}
