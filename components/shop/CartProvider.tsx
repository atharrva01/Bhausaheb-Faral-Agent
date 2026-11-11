"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { PricedCart } from "@/lib/cart";

type CartContextValue = {
  cart: PricedCart | null;
  busy: boolean;
  error: string | null;
  qtyOf: (productId: string) => number;
  refresh: () => Promise<void>;
  setQuantity: (productId: string, quantity: number) => Promise<void>;
  setCountry: (country: string | null) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

/** Fired when something other than this provider (the counter's agent) changed the server cart. */
export const CART_CHANGED_EVENT = "bf:cart-changed";

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

async function call(body?: unknown): Promise<PricedCart> {
  const res = await fetch("/api/cart", {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? "Cart error");
  return json;
}

/** Client mirror of the server cart. The server is the source of truth; the chat agent edits the same cart. */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<PricedCart | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (body?: unknown) => {
    setBusy(true);
    setError(null);
    try {
      setCart(await call(body));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cart error");
    } finally {
      setBusy(false);
    }
  }, []);

  // Initial load (setState only in the async callback).
  useEffect(() => {
    let alive = true;
    call()
      .then((c) => alive && setCart(c))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onChanged = () => void run();
    window.addEventListener(CART_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(CART_CHANGED_EVENT, onChanged);
  }, [run]);

  const value: CartContextValue = {
    cart,
    busy,
    error,
    qtyOf: (productId) => cart?.lines.find((l) => l.productId === productId)?.quantity ?? 0,
    refresh: () => run(),
    setQuantity: (productId, quantity) => run({ action: "set", productId, quantity }),
    setCountry: (country) => run({ action: "country", country }),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
