"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "poroda-cart-v1";

export type CartLineSnapshot = {
  productId: string;
  slug: string;
  title: string;
  price: number;
  quantity: number;
};

type CartContextValue = {
  lines: CartLineSnapshot[];
  addProduct: (p: { id: string; slug: string; title: string; price: number }, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeProduct: (productId: string) => void;
  clearCart: () => void;
  totalQuantity: number;
  subtotal: number;
  hydrated: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLineSnapshot[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (row): row is CartLineSnapshot =>
              row &&
              typeof row === "object" &&
              typeof (row as CartLineSnapshot).productId === "string" &&
              typeof (row as CartLineSnapshot).slug === "string" &&
              typeof (row as CartLineSnapshot).title === "string" &&
              typeof (row as CartLineSnapshot).price === "number" &&
              typeof (row as CartLineSnapshot).quantity === "number"
          );
          setLines(cleaned);
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines, hydrated]);

  const addProduct = useCallback(
    (p: { id: string; slug: string; title: string; price: number }, quantity = 1) => {
      const q = Math.max(1, Math.min(99, quantity));
      setLines((prev) => {
        const i = prev.findIndex((l) => l.productId === p.id);
        if (i >= 0) {
          const next = [...prev];
          const newQ = Math.min(99, next[i].quantity + q);
          next[i] = {
            ...next[i],
            quantity: newQ,
            title: p.title,
            price: p.price,
            slug: p.slug,
          };
          return next;
        }
        return [...prev, { productId: p.id, slug: p.slug, title: p.title, price: p.price, quantity: q }];
      });
    },
    []
  );

  const setQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setLines((prev) => prev.filter((l) => l.productId !== productId));
      return;
    }
    const q = Math.min(99, quantity);
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, quantity: q } : l)));
  }, []);

  const removeProduct = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const totalQuantity = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines]);
  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.price * l.quantity, 0), [lines]);

  const value = useMemo(
    () => ({
      lines,
      addProduct,
      setQuantity,
      removeProduct,
      clearCart,
      totalQuantity,
      subtotal,
      hydrated,
    }),
    [lines, addProduct, setQuantity, removeProduct, clearCart, totalQuantity, subtotal, hydrated]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
