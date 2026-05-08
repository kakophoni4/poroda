"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
  type ReactNode,
} from "react";
import { useSiteCopy } from "@/context/SiteCopyContext";
import {
  CART_STOCK_THROTTLE_KEY,
  fetchProductStockByIds,
  lineIsUnavailable,
  STOCK_THROTTLE_MS,
} from "@/lib/product-stock-client";

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
  addProduct: (
    p: { id: string; slug: string; title: string; price: number; inStock?: boolean },
    quantity?: number
  ) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeProduct: (productId: string) => void;
  clearCart: () => void;
  totalQuantity: number;
  subtotal: number;
  hydrated: boolean;
  /** Счётчик: увеличивается после синхронизации корзины с /api/products/by-ids (удалены несоответствующие позиции) */
  cartStockEpoch: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const t = useSiteCopy();
  const [lines, setLines] = useState<CartLineSnapshot[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [cartStockEpoch, setCartStockEpoch] = useState(0);
  const linesRef = useRef(lines);
  useLayoutEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  useEffect(() => {
    /* rehydration cart из localStorage — только в этом эффекте */
    /* eslint-disable react-hooks/set-state-in-effect */
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
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  /** Синхронизация корзины с БД сразу после гидрации: не чаще 1 раза в 30 c (sessionStorage) */
  useEffect(() => {
    if (!hydrated) return;
    const L = linesRef.current;
    if (L.length === 0) return;
    let last = 0;
    try {
      last = parseInt(sessionStorage.getItem(CART_STOCK_THROTTLE_KEY) || "0", 10) || 0;
    } catch {
      /* ignore */
    }
    if (Date.now() - last < STOCK_THROTTLE_MS) return;

    let cancelled = false;
    (async () => {
      const ids = L.map((l) => l.productId);
      const products = await fetchProductStockByIds(ids);
      if (cancelled || products == null) return;
      try {
        sessionStorage.setItem(CART_STOCK_THROTTLE_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
      const removeIds = new Set<string>();
      for (const line of L) {
        const row = products.find((p) => p.id === line.productId);
        if (lineIsUnavailable(row)) removeIds.add(line.productId);
      }
      if (removeIds.size === 0) return;
      const removedLines = L.filter((l) => removeIds.has(l.productId));
      if (cancelled) return;
      setLines((prev) => prev.filter((l) => !removeIds.has(l.productId)));
      setCartStockEpoch((e) => e + 1);
      const names = removedLines.map((l) => l.title).join(", ");
      window.alert(`${t("cart.removed_out_of_stock")}${names}`);
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, t]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines, hydrated]);

  const addProduct = useCallback(
    (p: { id: string; slug: string; title: string; price: number; inStock?: boolean }, quantity = 1) => {
      if (p.inStock === false) return;
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
      cartStockEpoch,
    }),
    [lines, addProduct, setQuantity, removeProduct, clearCart, totalQuantity, subtotal, hydrated, cartStockEpoch]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
