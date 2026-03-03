import Container from "@/components/Container";
import PageShell from "@/components/PageShell";

export default function AboutPage() {
  return (
    <PageShell>
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">О бренде</h1>
        <p className="mt-2 text-lg text-zinc-600">PORODA – благородство начинается с честности.</p>

        {/* Один блок — расширяется при заходе на страницу */}
        <div className="animate-expand-block mt-10">
          <div className="liquidGlass-dock rounded-3xl border border-white/40 p-8 sm:p-10">
            <div className="space-y-6 text-base leading-relaxed text-zinc-700 sm:text-lg sm:leading-loose">
              <p>
                Мы не обещаем чудес за одну ночь. Наша косметика — это честный, но эффективный подход к уходу за кожей,
                основанный на науке и профессиональных разработках. В каждом нашем продукте сочетаются современные
                технологии и натуральные ингредиенты, чтобы ваша кожа была не просто красивой, а здоровой.
              </p>
              <p>
                Миссия бренда PORODA — раскрывать природную красоту каждой женщины, создавая профессиональную косметику,
                которая подчёркивает уникальность и естественность. Мы стремимся поддерживать здоровье кожи через научно
                обоснованные формулы: каждый компонент работает в гармонии с другими, чтобы дать не только видимый результат,
                но и уверенность в себе.
              </p>
              <p>
                PORODA — российский бренд, основанный в 2024 году. Продукция выпускается на современном производстве
                в городе Киров, сертифицированном по международным стандартам. Для нас важны прозрачность, контроль
                качества и возможность отвечать за каждую формулу.
              </p>
              <p>
                Наша цель — помогать женщинам принимать и ценить свою индивидуальность, открывая свою «породу»:
                естественную красоту и уникальные черты. Не маскировать, а раскрывать то, что уже заложено природой.
              </p>
            </div>
          </div>
        </div>

        <nav className="mt-12 flex justify-center">
          <a
            href="/catalog"
            className="rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Перейти в каталог
          </a>
        </nav>
      </Container>
    </PageShell>
  );
}
