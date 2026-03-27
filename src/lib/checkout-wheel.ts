/** Сегменты колеса (индекс = по часовой стрелке от верха). На колесе — только короткие подписи wheelLines. */
export const CHECKOUT_WHEEL_SEGMENTS = [
  { index: 0, label: "200 ₽", wheelLines: ["200 ₽"] as const },
  { index: 1, label: "250 ₽", wheelLines: ["250 ₽"] as const },
  { index: 2, label: "300 ₽", wheelLines: ["300 ₽"] as const },
  { index: 3, label: "5%", wheelLines: ["5%"] as const },
  { index: 4, label: "10%", wheelLines: ["10%"] as const },
  { index: 5, label: "15%", wheelLines: ["15%"] as const },
  { index: 6, label: "JACKPOT", wheelLines: ["JACKPOT"] as const },
] as const;

export type CheckoutWheelSegment = (typeof CHECKOUT_WHEEL_SEGMENTS)[number];

export const CHECKOUT_WHEEL_SEGMENT_COUNT = CHECKOUT_WHEEL_SEGMENTS.length;

export const TG_WHEEL_PRIZE_PERCENT = 25;

/** Угол поворота (градусы, CSS), чтобы указатель сверху попал в центр сегмента winIndex */
export function wheelRotationForSegment(winIndex: number, fullTurns = 5): number {
  const n = CHECKOUT_WHEEL_SEGMENT_COUNT;
  const seg = 360 / n;
  return fullTurns * 360 + (360 - winIndex * seg - seg / 2);
}
