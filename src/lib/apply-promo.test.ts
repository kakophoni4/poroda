import { describe, expect, it } from "vitest";
import type { PromoForApply } from "./apply-promo";
import { applyPromoToTotal } from "./apply-promo";

function base(over: Partial<PromoForApply> = {}): PromoForApply {
  return {
    percent: 0,
    discountRub: null,
    maxUses: null,
    usedCount: 0,
    validFrom: null,
    validTo: null,
    minOrderTotal: null,
    active: true,
    ...over,
  };
}

describe("applyPromoToTotal", () => {
  it("процент 10% от 1000 → 900", () => {
    expect(applyPromoToTotal(1000, base({ percent: 10, discountRub: 0 }))).toEqual({
      ok: true,
      finalTotal: 900,
    });
  });

  it("фикс 200 от 1000 → 800", () => {
    expect(applyPromoToTotal(1000, base({ percent: 0, discountRub: 200 }))).toEqual({
      ok: true,
      finalTotal: 800,
    });
  });

  it("фикс 2000 от 1000 → 0, не в минусе", () => {
    expect(applyPromoToTotal(1000, base({ percent: 0, discountRub: 2000 }))).toEqual({
      ok: true,
      finalTotal: 0,
    });
  });

  it("maxUses достигнут", () => {
    const r = applyPromoToTotal(1000, base({ maxUses: 2, usedCount: 2, percent: 10 }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("Промокод уже использован");
  });

  it("minOrderTotal: корзина ниже порога", () => {
    const r = applyPromoToTotal(2000, base({ percent: 10, minOrderTotal: 3500 }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("Промокод действует при сумме заказа от 3500 ₽");
  });

  it("minOrderTotal: корзина на пороге и выше", () => {
    expect(applyPromoToTotal(3500, base({ percent: 10, minOrderTotal: 3500 }))).toEqual({
      ok: true,
      finalTotal: 3150,
    });
  });

  it("validTo в прошлом", () => {
    const r = applyPromoToTotal(1000, {
      percent: 10,
      discountRub: null,
      maxUses: null,
      usedCount: 0,
      validFrom: null,
      validTo: new Date("2020-01-01"),
      minOrderTotal: null,
      active: true,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("Срок действия промокода истёк");
  });

  it("validFrom в будущем", () => {
    const r = applyPromoToTotal(1000, {
      percent: 10,
      discountRub: null,
      maxUses: null,
      usedCount: 0,
      validFrom: new Date("2035-12-01"),
      validTo: null,
      minOrderTotal: null,
      active: true,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("Промокод ещё не действует");
  });
});
