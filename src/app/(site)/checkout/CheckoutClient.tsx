"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { Product } from "@/lib/catalog-data";
import { useCart } from "@/context/CartContext";

export default function CheckoutClient({ products }: { products: Product[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { lines, addProduct, setQuantity, removeProduct, clearCart, hydrated } = useCart();
  const mergedFromUrl = useRef(false);

  useEffect(() => {
    if (!hydrated || mergedFromUrl.current) return;
    const productId = searchParams.get("product");
    const qty = Math.max(1, Number(searchParams.get("qty")) || 1);
    if (productId) {
      const product = products.find((p) => p.id === productId);
      if (product) {
        addProduct(
          { id: product.id, slug: product.slug, title: product.title, price: product.price },
          qty
        );
      }
      mergedFromUrl.current = true;
      router.replace("/checkout", { scroll: false });
    }
  }, [hydrated, searchParams, products, addProduct, router]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [payMethod, setPayMethod] = useState<"online" | "on_delivery">("online");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  /** После clearCart() сумма в корзине обнуляется — сохраняем для экрана оплаты */
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null);

  const cartRows = useMemo(() => {
    return lines.map((line) => {
      const live = products.find((p) => p.id === line.productId);
      const title = live?.title ?? line.title;
      const price = live?.price ?? line.price;
      const slug = live?.slug ?? line.slug;
      return { line, title, price, slug };
    });
  }, [lines, products]);

  const total = useMemo(
    () => cartRows.reduce((sum, { price, line }) => sum + price * line.quantity, 0),
    [cartRows]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartRows.length === 0) return;
    setIsSubmitting(true);
    setPaymentUrl(null);
    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone,
          name,
          address,
          items: cartRows.map(({ line, title, price }) => ({
            productId: line.productId,
            title,
            price,
            quantity: line.quantity,
          })),
          promoCode: promoCode.trim() || undefined,
          total,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Ошибка создания заказа");
      const orderId = orderData.order?.id || orderData.orderNumber;
      const finalTotal = orderData.order?.total ?? total;
      const returnUrl = typeof window !== "undefined" ? `${window.location.origin}/account?order=${orderId}` : "";
      if (payMethod === "online") {
        const res = await fetch("/api/payment/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber: orderId,
            amount: finalTotal,
            returnUrl,
            description: `Заказ PORODA ${orderId}`,
          }),
        });
        const data = await res.json();
        if (data.confirmationUrl) {
          setPaymentAmount(finalTotal);
          clearCart();
          setPaymentUrl(data.confirmationUrl);
          return;
        }
        if (!res.ok) throw new Error(data.error || "Ошибка создания платежа");
      }
      clearCart();
      window.location.href = `/account?order=${orderId}&paid=later`;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка. Попробуйте позже.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (paymentUrl) {
    const amount = paymentAmount ?? total;
    return (
      <div className="liquidGlass-dock mt-8 rounded-3xl border border-white/40 p-8 text-center">
        <p className="text-lg font-medium">Переход к оплате</p>
        <p className="mt-2 text-sm text-zinc-600">Вы будете перенаправлены на безопасную страницу оплаты.</p>
        <a
          href={paymentUrl}
          className="mt-6 inline-flex rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Оплатить {amount.toLocaleString("ru-RU")} ₽
        </a>
      </div>
    );
  }

  if (!hydrated) {
    return <div className="liquidGlass-dock mt-8 h-48 animate-pulse rounded-3xl border border-white/40" />;
  }

  if (cartRows.length === 0) {
    return (
      <div className="liquidGlass-dock mt-8 rounded-3xl border border-white/40 p-8 text-center">
        <p className="text-zinc-700">В корзине пока ничего нет.</p>
        <Link href="/catalog" className="mt-4 inline-block rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800">
          Перейти к продукции
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700">Имя</label>
          <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="liquid-input mt-1 w-full rounded-xl px-4 py-2.5" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="liquid-input mt-1 w-full rounded-xl px-4 py-2.5" />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-zinc-700">Телефон</label>
          <input id="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="liquid-input mt-1 w-full rounded-xl px-4 py-2.5" />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-zinc-700">Адрес доставки</label>
          <textarea id="address" required rows={3} value={address} onChange={(e) => setAddress(e.target.value)} className="liquid-input mt-1 w-full rounded-xl px-4 py-2.5" />
        </div>
        <div>
          <label htmlFor="promo" className="block text-sm font-medium text-zinc-700">Промокод</label>
          <input id="promo" type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="Необязательно" className="liquid-input mt-1 w-full rounded-xl px-4 py-2.5" />
        </div>
        <div>
          <span className="block text-sm font-medium text-zinc-700">Способ оплаты</span>
          <div className="mt-2 flex gap-4">
            <label className="flex items-center gap-2">
              <input type="radio" name="pay" checked={payMethod === "online"} onChange={() => setPayMethod("online")} />
              Оплата на сайте (картой)
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="pay" checked={payMethod === "on_delivery"} onChange={() => setPayMethod("on_delivery")} />
              При получении
            </label>
          </div>
        </div>
      </div>
      <div>
        <div className="liquidGlass-dock rounded-3xl border border-white/40 p-6">
          <h2 className="text-lg font-semibold">Ваш заказ</h2>
          <ul className="mt-4 space-y-3">
            {cartRows.map(({ line, title, price, slug }) => (
              <li key={line.productId} className="liquidGlass-dock rounded-xl border border-white/40 p-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Link href={`/catalog/${slug}`} className="min-w-0 flex-1 font-medium text-zinc-900 hover:underline">
                    {title}
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeProduct(line.productId)}
                    className="shrink-0 text-xs text-zinc-500 hover:text-red-700"
                  >
                    Убрать
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="glass-subtle rounded-lg border border-white/45 px-2 py-1 text-xs font-medium transition hover:bg-white/45"
                      onClick={() => setQuantity(line.productId, line.quantity - 1)}
                      aria-label="Меньше"
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center tabular-nums">{line.quantity}</span>
                    <button
                      type="button"
                      className="glass-subtle rounded-lg border border-white/45 px-2 py-1 text-xs font-medium transition hover:bg-white/45"
                      onClick={() => setQuantity(line.productId, line.quantity + 1)}
                      aria-label="Больше"
                    >
                      +
                    </button>
                  </div>
                  <span className="tabular-nums font-medium text-zinc-800">
                    {(price * line.quantity).toLocaleString("ru-RU")} ₽
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-white/40 pt-4 text-lg font-semibold">
            <span>Итого</span>
            <span className="tabular-nums">{total.toLocaleString("ru-RU")} ₽</span>
          </div>
          <button type="submit" disabled={isSubmitting} className="mt-6 w-full rounded-2xl bg-zinc-900 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
            {payMethod === "online" ? "Перейти к оплате" : "Оформить заказ"}
          </button>
          <Link href="/catalog" className="mt-4 block text-center text-sm text-zinc-600 hover:text-zinc-900">Вернуться к продукции</Link>
        </div>
      </div>
    </form>
  );
}
