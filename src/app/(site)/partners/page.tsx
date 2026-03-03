"use client";

import { useState } from "react";
import Container from "@/components/Container";
import PageShell from "@/components/PageShell";

const REASONS: { title: string; text: string }[] = [
  {
    title: "Без обучения и сложных процедур",
    text: "Наша линейка домашнего ухода проста в использовании, и вам не нужно проводить дополнительное сложное обучение для персонала. Продукты идеально дополняют процедуры в клинике.",
  },
  {
    title: "Особо выгодные условия для первых партнеров",
    text: "Для новых партнеров мы предлагаем эксклюзивные скидки и гибкие условия сотрудничества. Также существует возможность эксклюзивного представительства в вашем регионе, что позволит вам занять лидирующие позиции на рынке.",
  },
  {
    title: "Поддержка на всех этапах",
    text: "Мы предлагаем пробники продукции для ваших клиентов, чтобы они могли оценить её качество перед покупкой.",
  },
  {
    title: "Высокое доверие специалистов",
    text: "Наша продукция была оценена не только косметологами, но и врачами дерматологами высшей квалификации, что гарантирует её безопасность и эффективность.",
  },
  {
    title: "Минимальные риски и вся необходимая документация",
    text: "Вся продукция имеет разрешительные документы, что подтверждает её безопасность и соответствие стандартам качества.",
  },
];

export default function PartnersPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <PageShell>
      <Container className="max-w-4xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Партнёрам</h1>
        <p className="mt-2 text-lg text-zinc-600">
          Стать официальным дистрибьютором PORODA — это выгодное партнерство для вашего бизнеса, которое принесет
          стабильный доход и доверие ваших клиентов.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:gap-12 lg:items-start">
          <div className="liquidGlass-dock aspect-[4/3] overflow-hidden rounded-3xl border border-white/40">
            <img
              src="/images/obshchie/IMG_0795.JPG"
              alt="Сотрудничество с PORODA"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="space-y-4 text-base leading-relaxed text-zinc-700">
            <p>
              Наши продукты для домашнего ухода разработаны с учетом потребностей современной кожи и не требуют
              дополнительного обучения для косметологов. Все, что нужно вашим клиентам — это регулярный и правильный
              уход с эффективными средствами, проверенными научными исследованиями.
            </p>
          </div>
        </div>

        <section className="mt-14">
          <h2 className="text-xl font-semibold text-zinc-900">5 причин работать с нами</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
            <ul className="flex flex-col gap-1">
              {REASONS.map((r, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                      openIndex === index
                        ? "liquid-glass border-white/50 bg-white/20 text-zinc-900"
                        : "border-white/40 text-zinc-700 hover:border-white/50 hover:bg-white/10"
                    }`}
                  >
                    <span className="line-clamp-2">{r.title}</span>
                    <span className="mt-1 block text-xs font-normal opacity-80">
                      {index + 1} из 5
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="liquidGlass-dock min-h-[200px] rounded-3xl border border-white/40 p-6 sm:p-8">
              {openIndex !== null ? (
                <div className="animate-fade-in">
                  <h3 className="text-base font-semibold text-zinc-900">{REASONS[openIndex].title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-700 sm:text-base">
                    {REASONS[openIndex].text}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">Выберите причину в списке, чтобы прочитать подробнее.</p>
              )}
            </div>
          </div>
        </section>

        <div className="mt-12 rounded-3xl border border-white/40 bg-white/5 p-6 text-center sm:p-8">
          <p className="text-base text-zinc-700 sm:text-lg">
            Пишите нам на почту{" "}
            <a
              href="mailto:hello@porodacosmetics.ru"
              className="font-medium text-zinc-900 underline decoration-zinc-400 underline-offset-2 hover:decoration-zinc-600"
            >
              hello@porodacosmetics.ru
            </a>
            , чтобы узнать подробности и начать сотрудничество!
          </p>
          <a
            href="mailto:hello@porodacosmetics.ru"
            className="liquid-glass glass-btn mt-4 inline-flex rounded-2xl border border-white/40 px-6 py-3 text-sm font-medium text-zinc-900"
          >
            Написать
          </a>
        </div>
      </Container>
    </PageShell>
  );
}
