"use client";

import { useCart } from "@/components/shop/CartProvider";

/** "Add a packet", which becomes a − n + counter once the item is on the bill. */
export function QuantityControl({ productId, name, stock }: { productId: string; name: string; stock: number }) {
  const { qtyOf, setQuantity, busy } = useCart();
  const qty = qtyOf(productId);

  if (stock <= 0) return <p className="text-[15px] text-pencil">Finished for this batch</p>;

  if (qty === 0) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => setQuantity(productId, 1)}
        className="h-10 whitespace-nowrap rounded-[4px] border-[1.5px] border-ink px-3.5 text-[15px] font-semibold hover:bg-paper disabled:opacity-50"
        aria-label={`Add a packet of ${name}`}
      >
        Add a packet
      </button>
    );
  }
  return (
    <div className="inline-flex h-10 items-stretch rounded-[4px] border-[1.5px] border-ink bg-paper" role="group" aria-label={`${name} packets`}>
      <button
        type="button"
        disabled={busy}
        onClick={() => setQuantity(productId, qty - 1)}
        className="w-10 text-xl leading-none hover:bg-wall disabled:opacity-50"
        aria-label={`One packet less ${name}`}
      >
        −
      </button>
      <span className="num flex min-w-9 items-center justify-center border-x border-rule font-semibold" aria-live="polite">
        {qty}
      </span>
      <button
        type="button"
        disabled={busy || qty >= stock}
        onClick={() => setQuantity(productId, qty + 1)}
        className="w-10 text-xl leading-none hover:bg-wall disabled:opacity-35"
        aria-label={`One more packet ${name}`}
      >
        +
      </button>
    </div>
  );
}
