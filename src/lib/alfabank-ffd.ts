/**
 * ФФД 1.2 + all2pay register.do: orderBundle, taxSystem.
 * Сверка с https://doc.all2pay.net/integration/router/alfa-api.html (раздел «Формирование чека ФФД»)
 * и OpenAPI: cartItems + itemAttributes (name/value), tax.taxType.
 *
 * tax.taxType: `ALFABANK_VAT_TYPE=none` — по умолчанию 6; при отказе UAT — попробовать `10` (без НДС, ФФД 1.2).
 */
const VAT_ALIASES: Record<string, number> = {
  none: 6,
  vat20: 0,
  vat10: 1,
  vat0: 4,
  vat5: 5,
};

/** СНО (тег 1055): 0=ОСН, 1=УСН доход, 2=УСН доход-расход, 3=ЕНВД, 4=ПСН, 5=НПД (см. ОФД). */
const TAX_SYSTEM_ALIASES: Record<string, number> = {
  osn: 0,
  usn_income: 1,
  usn_income_expense: 2,
  usn_income_outcome: 2,
  envd: 3,
  patent: 4,
  npd: 5,
};

const PAYMENT_METHOD_ALIASES: Record<string, string> = {
  full_prepayment: "1",
  prepayment: "2",
  advance: "3",
  full_payment: "4",
  partial_payment: "5",
  credit: "6",
  credit_payment: "7",
};

const PAYMENT_OBJECT_ALIASES: Record<string, string> = {
  commodity: "1",
  excisable: "2",
  job: "3",
  service: "4",
  payment: "5",
  agent_commission: "6",
  another: "7",
  property_right: "8",
  non_operating: "9",
  tax: "10",
  insurance: "11",
  service_composition: "12",
  other: "13",
};

export type AlfabankFfdConfig = {
  taxSystem: string;
  vatType: string;
  deliveryVatType: string;
  paymentMethod: string;
  paymentObject: string;
  deliveryPaymentObject: string;
  ffdVersion: string;
};

export function mapVatTypeToTaxType(v: string | undefined): number {
  const s = (v ?? "none").trim().toLowerCase();
  if (/^\d{1,2}$/.test(s)) return parseInt(s, 10);
  return VAT_ALIASES[s] ?? 6;
}

export function mapTaxSystemToCode(v: string | undefined): number {
  const s = (v ?? "usn_income").trim().toLowerCase();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  return TAX_SYSTEM_ALIASES[s] ?? 1;
}

function mapAttrValue(
  v: string | undefined,
  aliases: Record<string, string>,
  fallback: string
): string {
  const s = (v ?? "").trim().toLowerCase();
  if (!s) return fallback;
  if (/^\d{1,2}$/.test(s)) return s;
  return aliases[s] ?? s;
}

export function mapPaymentMethodValue(v: string | undefined): string {
  return mapAttrValue(v, PAYMENT_METHOD_ALIASES, "1");
}

export function mapPaymentObjectValue(v: string | undefined): string {
  return mapAttrValue(v, PAYMENT_OBJECT_ALIASES, "1");
}

export type OrderItemForBundle = {
  productTitle: string;
  unitPriceKop: number;
  quantity: number;
  isDelivery: boolean;
};

/**
 * itemAttributes: в all2pay для ФФД — `paymentObject` и `paymentMethod` (camelCase,
 * как в примерах OrderBundle / router API). При отказе шлюза попробовать `payment_object` / `payment_method`.
 */
function itemAttributes(
  paymentMethod: string,
  paymentObject: string
): { attributes: { name: string; value: string }[] } {
  return {
    attributes: [
      { name: "paymentMethod", value: paymentMethod },
      { name: "paymentObject", value: paymentObject },
    ],
  };
}

function allocateKopByWeights(weights: number[], totalKop: number): number[] {
  const wsum = weights.reduce((a, b) => a + b, 0);
  const n = weights.length;
  if (n === 0 || wsum <= 0) return weights.map(() => 0);
  const out: number[] = new Array(n).fill(0);
  let s = 0;
  for (let i = 0; i < n - 1; i++) {
    out[i] = Math.floor((totalKop * weights[i]!) / wsum);
    s += out[i]!;
  }
  out[n - 1] = totalKop - s;
  return out;
}

/**
 * Сумма `lineKop` (коп) в целом по позиции на `q` единиц; разбиваем максимум на 2 субстроки,
 * чтобы `itemPrice*quantity = itemAmount` (в коп.) внутри субстрок.
 */
function splitIntLineKop(
  name: string,
  lineKop: number,
  q: number,
  isDelivery: boolean
): OrderItemForBundle[] {
  if (q <= 0) return [];
  if (lineKop === 0) return [];
  const p = Math.floor(lineKop / q);
  const r = lineKop - p * q;
  if (r === 0) {
    return [{ productTitle: name, unitPriceKop: p, quantity: q, isDelivery }];
  }
  const lowQ = q - r;
  const o: OrderItemForBundle[] = [];
  if (lowQ > 0) o.push({ productTitle: name, unitPriceKop: p, quantity: lowQ, isDelivery });
  o.push({ productTitle: name, unitPriceKop: p + 1, quantity: r, isDelivery });
  return o;
}

/**
 * Сумма оплаты (коп) = amount в register.do. Доставка: totalKop − по каталогу (если > 0).
 * Промо: веса по subtotal, затем int-разбивка по `price*100` (не более 2 субстрок/товар).
 */
export function buildOrderItemLines(
  orderItems: { price: number; quantity: number; productTitle: string }[],
  totalKop: number
): OrderItemForBundle[] {
  const subtotalKop = orderItems.reduce(
    (s, it) => s + it.price * it.quantity * 100,
    0
  );
  if (orderItems.length === 0) return [];
  const delKop = totalKop - subtotalKop;
  if (delKop > 0) {
    const base: OrderItemForBundle[] = orderItems.map((it) => ({
      productTitle: it.productTitle,
      unitPriceKop: it.price * 100,
      quantity: it.quantity,
      isDelivery: false,
    }));
    return [
      ...base,
      {
        productTitle: "Доставка",
        unitPriceKop: delKop,
        quantity: 1,
        isDelivery: true,
      },
    ];
  }
  if (subtotalKop === 0) {
    return [];
  }
  if (delKop === 0) {
    return orderItems.map((it) => ({
      productTitle: it.productTitle,
      unitPriceKop: it.price * 100,
      quantity: it.quantity,
      isDelivery: false,
    }));
  }
  const weights = orderItems.map((it) => it.price * it.quantity * 100);
  const lineKops = allocateKopByWeights(weights, totalKop);
  const out: OrderItemForBundle[] = [];
  for (let i = 0; i < orderItems.length; i++) {
    const it = orderItems[i]!;
    out.push(
      ...splitIntLineKop(
        it.productTitle,
        lineKops[i]!,
        it.quantity,
        false
      )
    );
  }
  return out;
}

export function buildOrderBundleJson(
  lines: OrderItemForBundle[],
  ffd: AlfabankFfdConfig
): Record<string, unknown> {
  const vat = mapVatTypeToTaxType(ffd.vatType);
  const delVat = mapVatTypeToTaxType(ffd.deliveryVatType);
  const pm = mapPaymentMethodValue(ffd.paymentMethod);
  const poGoods = mapPaymentObjectValue(ffd.paymentObject);
  const poDel = mapPaymentObjectValue(ffd.deliveryPaymentObject);

  const orderItems = lines.map((it, i) => {
    const isDel = it.isDelivery;
    const lineAmount = it.unitPriceKop * it.quantity;
    return {
      positionId: String(i + 1),
      name: it.productTitle.slice(0, 128),
      quantity: { value: it.quantity, measure: "шт" },
      itemAmount: lineAmount,
      itemPrice: it.unitPriceKop,
      itemCurrency: 643,
      tax: { taxType: isDel ? delVat : vat },
      itemAttributes: itemAttributes(
        pm,
        isDel ? poDel : poGoods
      ),
    };
  });

  const root: Record<string, unknown> = {
    cartItems: { items: orderItems },
  };
  const ffdV = ffd.ffdVersion.trim();
  if (ffdV) {
    root.ffdVersion = ffdV;
  }
  return root;
}
