import Container from "@/components/Container";
import PageShell from "@/components/PageShell";

export default function PhilosophyPage() {
  return (
    <PageShell>
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Философия PORODA</h1>
        <p className="mt-2 text-lg text-zinc-600">Благородство начинается с честности.</p>

        {/* Один блок — расширяется при заходе на страницу */}
        <div className="animate-expand-block mt-10">
          <div className="liquidGlass-dock rounded-3xl border border-white/40 p-8 sm:p-10">
            <div className="space-y-6 text-base leading-relaxed text-zinc-700 sm:text-lg sm:leading-loose">
              <p>
                Когда природа творила своё великое произведение и создавала женщину, она украсила её не только
                невероятной красотой, но и уникальными чертами характера. Из этой тайной смеси качеств рождаются
                породистые женщины – воплощение благородства, стиля и силы духа.
              </p>
              <p>
                Именно эту идею мы воплощаем в нашем бренде PORODA. Наше имя олицетворяет нечто большее, чем просто
                красота. Это символ утончённости и элегантности, воплощённый в каждом нашем продукте.
              </p>
              <p>
                Для нас PORODA — это не просто слово. Это два слова: «по роду». В каждой женщине отпечатываются черты
                её предков, их любовь, достоинство и мудрость. PORODA — это возвращение к себе. К той, какой тебя
                задумала природа и твой род. Это не про то, чтобы стать кем-то другим. Это про роскошь быть собой —
                естественной, сильной, харизматичной.
              </p>
              <p>
                Бренд PORODA – это своеобразный гид по прекрасному миру женственности, где каждая женщина обретает свою
                уникальность. Мы верим, что истинная красота приводит к внутреннему благородству, а настоящий стиль
                идёт рука об руку с чувством собственного достоинства.
              </p>
              <p>
                Наша косметика – не маска и не попытка «исправить» тебя. Она создана, чтобы поддерживать твою кожу в
                диалоге с природой и родом: честно, без лишнего шума, с акцентом на состав и ощущения. Комфортно каждый
                день, без перегруза – так, чтобы роскошь быть собой проявлялась и в ритуале ухода.
              </p>
              <p className="pt-4 text-center text-xl font-semibold text-zinc-900 sm:text-2xl">
                Ты рождена быть собой. Ты — порода.
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
