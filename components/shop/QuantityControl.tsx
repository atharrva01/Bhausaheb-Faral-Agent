"use client";

import { useCart } from "@/components/shop/CartProvider";

/** "Add to cart" that turns into a − n + stepper once the product is in the cart. Never opens anything. */
export function QuantityControl({ productId, stock, compact = false }: { productId: string; stock: number; compact?: boolean }) {
  const { qtyOf, setQuantity, busy } = useCart();
  const qty = qtyOf(productId);
  const h = compact ? "h-8 text-sm" : "h-10";

  if (stock <= 0) {
    return (
      <div className={`${h} flex w-full items-center justify-center rounded-lg bg-ink/5 text-sm font-semibold text-muted`}>
        Sold out
      </div>
    );
  }

  if (qty === 0) {
    return (
      <button
        disabled={busy}
        onClick={() => setQuantity(productId, 1)}
        className={`${h} w-full rounded-lg bg-maroon font-semibold text-cream transition hover:bg-maroon-dark active:scale-[0.98] disabled:opacity-60`}
      >
        Add to cart
      </button>
    );
  }

  return (
    <div className={`${h} flex w-full items-stretch overflow-hidden rounded-lg border-2 border-maroon bg-white`}>
      <button
        disabled={busy}
        onClick={() => setQuantity(productId, qty - 1)}
        className="w-11 text-xl font-bold text-maroon hover:bg-cream-deep disabled:opacity-50"
        aria-label="Remove one"
      >
        −
      </button>
      <span className="flex flex-1 items-center justify-center font-semibold tabular-nums" aria-live="polite">
        {qty} in cart
      </span>
      <button
        disabled={busy || qty >= stock}
        onClick={() => setQuantity(productId, qty + 1)}
        className="w-11 text-xl font-bold text-maroon hover:bg-cream-deep disabled:opacity-30"
        aria-label="Add one"
      >
        +
      </button>
    </div>
  );
}
