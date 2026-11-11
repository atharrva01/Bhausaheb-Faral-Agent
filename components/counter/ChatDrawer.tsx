"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Counter } from "@/components/counter/Counter";
import { OPEN_ASSISTANT_EVENT } from "@/components/counter/events";
import { useCart } from "@/components/shop/CartProvider";
import { formatUSD } from "@/lib/money";

/**
 * "Ask Aai": a right-hand slide-over (full screen on phones), opened from the header, the banner ask bar
 * or the mobile bar. The conversation lives in a shared provider, so closing it loses nothing.
 */
export function ChatDrawer() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { cart } = useCart();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_ASSISTANT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_ASSISTANT_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const count = cart?.itemCount ?? 0;

  // Always mounted (hidden when closed) so the conversation and event listeners stay alive.
  return (
    <div className={open ? "fixed inset-0 z-50" : "hidden"} role="dialog" aria-modal="true" aria-labelledby="ask-aai-title">
      <button className="absolute inset-0 hidden bg-ink/40 sm:block" aria-label="Close Ask Aai" tabIndex={-1} onClick={() => setOpen(false)} />
      <div className="absolute inset-y-0 right-0 flex w-full flex-col bg-page shadow-2xl sm:w-[440px]">
        <header className="flex items-center justify-between gap-3 bg-brand px-4 py-3 text-white">
          <div>
            <h2 id="ask-aai-title" className="type-head text-xl">
              Ask Aai
            </h2>
            <p className="text-[13px] text-white/85">Order by chatting. Prices always come from the shop.</p>
          </div>
          <button ref={closeRef} type="button" onClick={() => setOpen(false)} className="h-10 rounded-[8px] px-3 font-semibold text-white underline underline-offset-4">
            Close
          </button>
        </header>
        <Counter className="min-h-0 flex-1" />
        {count > 0 && cart && (
          <div className="flex items-center justify-between gap-3 border-t border-line bg-mint px-4 py-2.5">
            <p className="num text-[15px]">
              Cart: <strong>{count}</strong> packet{count === 1 ? "" : "s"}, <strong>{formatUSD(cart.quote?.supported ? cart.quote.totalCents : cart.subtotalCents)}</strong>
            </p>
            <Link href="/checkout" onClick={() => setOpen(false)} className="flex h-10 items-center rounded-[8px] bg-cta px-4 font-semibold text-ink hover:bg-cta-hi">
              Checkout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
