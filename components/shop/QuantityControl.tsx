"use client";

import { useCart } from "@/components/shop/CartProvider";

/** Big "Add to cart", which becomes a − n + stepper once the item is on the bill. */
export function QuantityControl({ productId, name, stock }: { productId: string; name: string; stock: number }) {
  const { qtyOf, setQuantity, busy } = useCart();
  const qty = qtyOf(productId);

  if (stock <= 0) {
    return <p className="flex h-11 items-center justify-center rounded-full border border-line text-[15px] text-muted">Finished for this batch</p>;
  }
  if (qty === 0) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => setQuantity(productId, 1)}
        className="h-11 w-full rounded-full bg-cta text-[15px] font-semibold text-ink transition-colors hover:bg-cta-hi disabled:opacity-60"
        aria-label={`Add ${name} to cart`}
      >
        Add to cart
      </button>
    );
  }
  return (
    <div className="flex h-11 w-full items-stretch overflow-hidden rounded-full border-2 border-cta bg-card" role="group" aria-label={`${name} in cart`}>
      <button
        type="button"
        disabled={busy}
        onClick={() => setQuantity(productId, qty - 1)}
        className="w-12 text-xl font-bold text-accent hover:bg-soft disabled:opacity-50"
        aria-label={`One packet less ${name}`}
      >
        −
      </button>
      <span className="num flex flex-1 items-center justify-center text-[15px] font-semibold" aria-live="polite">
        {qty} in cart
      </span>
      <button
        type="button"
        disabled={busy || qty >= stock}
        onClick={() => setQuantity(productId, qty + 1)}
        className="w-12 text-xl font-bold text-accent hover:bg-soft disabled:opacity-35"
        aria-label={`One more packet ${name}`}
      >
        +
      </button>
    </div>
  );
}
