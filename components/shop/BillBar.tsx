"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/shop/CartProvider";
import { RunningBill } from "@/components/shop/RunningBill";
import { billFromCart } from "@/components/bill/cartToBill";
import { formatUSD } from "@/lib/money";

/** Phones/tablets: a quiet bar with the bill total; "See bill" opens the same slip as a bottom sheet. */
export function BillBar() {
  const { cart } = useCart();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const count = cart?.itemCount ?? 0;

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (count === 0 || !cart) return null;
  const b = billFromCart(cart);
  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-wall lg:hidden">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-4 py-3">
          <p className="num text-base">
            Bill: {count} packet{count === 1 ? "" : "s"}, <strong>{formatUSD(b.totalCents)}</strong>
            {!b.hasCountry && <span className="text-pencil"> before postage</span>}
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-11 rounded-[4px] border-[1.5px] border-ink bg-paper px-4 font-semibold"
            aria-haspopup="dialog"
          >
            See bill
          </button>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden" role="dialog" aria-modal="true" aria-label="Your bill">
          <button className="absolute inset-0 bg-ink/45" aria-label="Close the bill" onClick={() => setOpen(false)} tabIndex={-1} />
          <div className="relative max-h-[88svh] overflow-y-auto bg-wall px-3 pb-5 pt-3">
            <div className="mb-2 flex justify-end">
              <button ref={closeRef} type="button" onClick={() => setOpen(false)} className="h-10 rounded-[4px] px-3 font-semibold underline underline-offset-4">
                Close
              </button>
            </div>
            <RunningBill onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
