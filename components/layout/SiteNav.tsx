"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/shop/CartProvider";
import { formatUSD } from "@/lib/money";

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="20" r="1.4" fill="currentColor" />
      <circle cx="17" cy="20" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function SiteNav() {
  const { cart } = useCart();
  const pathname = usePathname();
  const count = cart?.itemCount ?? 0;
  const onCheckout = pathname === "/checkout";
  if (pathname.startsWith("/owner")) return null; // owner pages have their own nav

  return (
    <>
      <nav className="sticky top-0 z-40 bg-maroon-dark text-cream shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
          <Link href="/" className="font-display text-xl leading-none">
            Bhausaheb Faral
          </Link>
          <Link
            href="/checkout"
            className="flex items-center gap-2 rounded-full bg-cream/10 px-3.5 py-1.5 text-sm font-semibold hover:bg-cream/20"
            aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
          >
            <CartIcon />
            {count > 0 ? (
              <>
                <span className="rounded-full bg-turmeric px-1.5 text-xs text-ink">{count}</span>
                <span className="hidden tabular-nums sm:inline">{formatUSD(cart!.subtotalCents)}</span>
              </>
            ) : (
              <span>Cart</span>
            )}
          </Link>
        </div>
      </nav>

      {/* Mobile: sticky "view cart" bar so checkout is always one tap away. */}
      {count > 0 && !onCheckout && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 p-3 backdrop-blur sm:hidden">
          <Link
            href="/checkout"
            className="flex items-center justify-between rounded-xl bg-maroon px-4 py-3 font-semibold text-cream"
          >
            <span>
              {count} item{count === 1 ? "" : "s"} · {formatUSD(cart!.subtotalCents)}
            </span>
            <span>Checkout →</span>
          </Link>
        </div>
      )}
    </>
  );
}
