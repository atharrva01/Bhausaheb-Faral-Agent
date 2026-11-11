"use client";

import Link from "next/link";
import type { CartView } from "@/lib/ai/customer-tools";
import { formatUSD } from "@/lib/money";

/** Cart result inside the conversation: what changed, the totals, and a way to check out. */
export function ChatCartCard({ cart }: { cart: CartView }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-line bg-card">
      <p className="flex items-center justify-between border-b border-line bg-mint px-3 py-2 text-[14px] font-semibold text-accent">
        <span>Cart updated</span>
        {cart.countryName && <span className="font-normal">to {cart.countryName}</span>}
      </p>
      <ul className="divide-y divide-line px-3 text-[15px]">
        {cart.lines.map((l) => (
          <li key={l.product} className="flex justify-between gap-3 py-2">
            <span>
              <span className="num font-semibold">{l.quantity} ×</span> {l.name}{" "}
              <span lang="mr" className="mr text-muted">
                {l.nameMarathi}
              </span>
            </span>
            <span className="num">{l.lineTotal}</span>
          </li>
        ))}
      </ul>
      <dl className="space-y-0.5 border-t border-line px-3 py-2 text-[15px]">
        <div className="flex justify-between">
          <dt className="text-muted">Items</dt>
          <dd className="num">{cart.subtotal}</dd>
        </div>
        {cart.shipping && (
          <div className="flex justify-between">
            <dt className="text-muted">Postage ({cart.weightKg} kg)</dt>
            <dd className="num">{cart.freeShipping ? "Free" : cart.shipping}</dd>
          </div>
        )}
        <div className="flex justify-between pt-1 text-base font-bold">
          <dt>Total</dt>
          <dd className="num">{cart.total ?? cart.subtotal}</dd>
        </div>
      </dl>
      <div className="px-3 pb-3">
        <Link href="/checkout" className="flex h-11 items-center justify-center rounded-[8px] bg-cta font-semibold text-ink hover:bg-cta-hi">
          Checkout, {formatUSD(cart.totalCents ?? cart.subtotalCents)}
        </Link>
      </div>
    </div>
  );
}
