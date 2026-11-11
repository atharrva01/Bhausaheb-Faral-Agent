"use client";

import Link from "next/link";
import { Bill } from "@/components/bill/Bill";
import { billFromCart } from "@/components/bill/cartToBill";
import { useCart } from "@/components/shop/CartProvider";
import { formatUSD } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/shipping";

/** The bill the shop keeps writing while you shop or chat. Same server cart as the rate board and the counter. */
export function RunningBill({ compact = false, animateIn = false, onNavigate }: { compact?: boolean; animateIn?: boolean; onNavigate?: () => void }) {
  const { cart, setQuantity, busy } = useCart();
  if (!cart) return null;
  const b = billFromCart(cart);
  const stockOf = (id: string) => cart.lines.find((l) => l.productId === id)?.stock ?? 0;
  const toFree = FREE_SHIPPING_THRESHOLD_CENTS - cart.subtotalCents;

  return (
    <Bill
      compact={compact}
      letterhead
      animateIn={animateIn}
      label="Your running bill"
      lines={b.lines}
      postage={b.postage}
      totalCents={b.totalCents}
      onQtyChange={(id, q) => setQuantity(id, q)}
      maxQty={stockOf}
      busy={busy}
      emptyText="Nothing on the bill yet. Tell the counter, or add packets from today's rates."
    >
      {cart.lines.length > 0 && (
        <div className={compact ? "space-y-2" : "space-y-3"}>
          {cart.warnings.map((w) => (
            <p key={w} className="text-[15px] text-khata">{w}</p>
          ))}
          <p className="text-sm text-pencil">
            {toFree > 0 ? `${formatUSD(toFree)} more and the postage is on us.` : "Postage is on us."}
          </p>
          <Link
            href="/checkout"
            onClick={onNavigate}
            className="flex h-12 items-center justify-center rounded-[4px] bg-stamp px-4 text-base font-semibold text-paper hover:bg-[#3f3168]"
          >
            Make my bill
          </Link>
        </div>
      )}
    </Bill>
  );
}
