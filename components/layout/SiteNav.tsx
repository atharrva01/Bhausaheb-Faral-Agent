"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/shop/CartProvider";
import { formatUSD } from "@/lib/money";
import { isShopPage } from "@/lib/ui-routes";
import { OPEN_CHAT_EVENT } from "@/components/chat/events";

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="20" r="1.4" fill="currentColor" />
      <circle cx="17" cy="20" r="1.4" fill="currentColor" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" strokeLinejoin="round" />
    </svg>
  );
}

export function SiteNav() {
  const { cart } = useCart();
  const pathname = usePathname();
  const count = cart?.itemCount ?? 0;
  if (pathname.startsWith("/owner")) return null; // owner pages have their own nav

  return (
    <>
      <nav className="sticky top-0 z-40 bg-maroon-dark text-cream shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-5">
            <Link href="/" className="font-display text-xl leading-none">
              Bhausaheb Faral
            </Link>
            <Link href="/about" className={`text-sm ${pathname === "/about" ? "font-semibold" : "text-cream/80 hover:text-cream"}`}>
              Our story
            </Link>
          </div>
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

      {/* Mobile: one bottom bar with both entry points (chat + checkout), shopping pages only. */}
      {isShopPage(pathname) && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-line bg-cream/95 p-3 backdrop-blur sm:hidden">
          <button
            onClick={() => window.dispatchEvent(new Event(OPEN_CHAT_EVENT))}
            className={`flex items-center justify-center gap-2 rounded-xl bg-saffron py-3 font-semibold text-white ${count > 0 ? "px-4" : "flex-1"}`}
          >
            <ChatIcon />
            {count > 0 ? "Ask Aai" : "Order by chatting with Aai's assistant"}
          </button>
          {count > 0 && (
            <Link href="/checkout" className="flex flex-1 items-center justify-between rounded-xl bg-maroon px-4 py-3 font-semibold text-cream">
              <span className="tabular-nums">
                {count} · {formatUSD(cart!.subtotalCents)}
              </span>
              <span>Checkout →</span>
            </Link>
          )}
        </div>
      )}
    </>
  );
}
