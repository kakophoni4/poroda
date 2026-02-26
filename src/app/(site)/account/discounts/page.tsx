import Breadcrumbs from "@/components/Breadcrumbs";

export default function AccountDiscountsPage() {
  const discounts = [
    { code: "WELCOME10", percent: 10, desc: "Приветственная скидка 10% на первый заказ" },
    { code: "LOYAL5", percent: 5, desc: "Накопительная скидка 5% (от 3 заказов)" },
  ];

  return (
    <>
      <Breadcrumbs items={[{ href: "/account", label: "Личный кабинет" }, { label: "Скидки" }]} />
      <h1 className="mt-4 text-2xl font-semibold">Скидки</h1>
      <p className="mt-2 text-sm text-zinc-600">Ваши персональные промокоды и условия.</p>
      <div className="mt-6 space-y-4">
        {discounts.map((d) => (
          <div key={d.code} className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-zinc-200 bg-white p-6">
            <div>
              <span className="font-mono font-semibold">{d.code}</span>
              <span className="ml-2 rounded-full bg-zinc-900 px-2 py-0.5 text-xs text-white">−{d.percent}%</span>
              <p className="mt-1 text-sm text-zinc-600">{d.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
