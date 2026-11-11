"use client";

import Link from "next/link";
import { useCart } from "@/components/shop/CartProvider";
import { billFromCart } from "@/components/bill/cartToBill";
import { AskButton } from "@/components/counter/AskButton";
import { formatUSD } from "@/lib/money";

/** Phones: Ask Aai + cart, always one tap away. */
export function BillBar() {
  const { cart } = useCart();
  const count = cart?.itemCount ?? 0;
  const b = cart ? billFromCart(cart) : null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 backdrop-blur sm:hidden">
      <div className="flex gap-2 px-3 py-2.5">
        <AskButton className={`h-12 rounded-[8px] border-2 border-brand px-4 font-semibold text-brand ${count > 0 ? "" : "flex-1"}`}>
          {count > 0 ? "Ask Aai" : "Order by chatting with Aai"}
        </AskButton>
        {count > 0 && b && (
          <Link href="/checkout" className="flex h-12 flex-1 items-center justify-between rounded-[8px] bg-cta px-4 font-semibold text-ink">
            <span className="num">
              Cart ({count}) {formatUSD(b.totalCents)}
            </span>
            <span>Checkout</span>
          </Link>
        )}
      </div>
    </div>
  );
}
