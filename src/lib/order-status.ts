/** Значения статуса заказа в БД */
export const ORDER_STATUS_VALUES = ["placed", "assembling", "shipping", "delivered"] as const;
export type OrderStatusValue = (typeof ORDER_STATUS_VALUES)[number];

const LABELS: Record<string, string> = {
  placed: "Оформлен",
  assembling: "В сборке",
  shipping: "В доставке",
  delivered: "Доставлен",
  pending: "Оформлен",
};

export function orderStatusLabel(status: string): string {
  return LABELS[status] ?? status;
}

/** Приводит legacy pending к placed; неизвестные — placed */
export function normalizeOrderStatus(status: string): OrderStatusValue {
  if (status === "pending") return "placed";
  if (ORDER_STATUS_VALUES.includes(status as OrderStatusValue)) return status as OrderStatusValue;
  return "placed";
}

export function isAllowedOrderStatus(status: string): status is OrderStatusValue {
  return ORDER_STATUS_VALUES.includes(status as OrderStatusValue);
}
