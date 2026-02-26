"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/catalog-data";

export default function CheckoutClient({ products }: { products: Product[] }) {
  const searchParams = useSearchParams();
  const productId = searchParams.get("product");
  const qty = Math.max(1, Number(searchParams.get("qty")) || 1);

  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>(() => {
    if (!productId) return [];
    const product = products.find((p) => p.id === productId);
    return product ? [{ product, quantity: qty }] : [];
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [payMethod, setPayMethod] = useState<"online" | "on_delivery">("online");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const total = useMemo(
    () => cart.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0),
    [cart]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
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
          items: cart.map(({ product, quantity }) => ({
            productId: product.id,
            title: product.title,
            price: product.price,
            quantity,
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
          setPaymentUrl(data.confirmationUrl);
          return;
        }
        if (!res.ok) throw new Error(data.error || "Ошибка создания платежа");
      }
      window.location.href = `/account?order=${orderId}&paid=later`;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка. Попробуйте позже.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (paymentUrl) {
    return (
      <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-8 text-center">
        <p className="text-lg font-medium">Переход к оплате</p>
        <p className="mt-2 text-sm text-zinc-600">Вы будете перенаправлены на безопасную страницу оплаты.</p>
        <a
          href={paymentUrl}
          className="mt-6 inline-flex rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Оплатить {total.toLocaleString("ru-RU")} ₽
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700">Имя</label>
          <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5" />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-zinc-700">Телефон</label>
          <input id="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5" />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-zinc-700">Адрес доставки</label>
          <textarea id="address" required rows={3} value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5" />
        </div>
        <div>
          <label htmlFor="promo" className="block text-sm font-medium text-zinc-700">Промокод</label>
          <input id="promo" type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="Необязательно" className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5" />
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
        <div className="rounded-3xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Ваш заказ</h2>
          <ul className="mt-4 space-y-2">
            {cart.map(({ product, quantity }) => (
              <li key={product.id} className="flex justify-between text-sm">
                <span>{product.title} × {quantity}</span>
                <span>{(product.price * quantity).toLocaleString("ru-RU")} ₽</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-zinc-200 pt-4 flex justify-between text-lg font-semibold">
            <span>Итого</span>
            <span>{total.toLocaleString("ru-RU")} ₽</span>
          </div>
          <button type="submit" disabled={isSubmitting || cart.length === 0} className="mt-6 w-full rounded-2xl bg-zinc-900 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
            {payMethod === "online" ? "Перейти к оплате" : "Оформить заказ"}
          </button>
          <Link href="/catalog" className="mt-4 block text-center text-sm text-zinc-600 hover:text-zinc-900">Вернуться в каталог</Link>
        </div>
      </div>
    </form>
  );
}
