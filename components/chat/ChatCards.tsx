"use client";

import type { CartView } from "@/lib/ai/customer-tools";

/** Cart summary card rendered from update_cart / get_cart / quote_shipping results. Values come from the server. */
export function CartCard({ cart }: { cart: CartView }) {
  if (cart.lines.length === 0) {
    return <div className="rounded-xl border border-line bg-cream px-3 py-2 text-sm text-muted">Cart is empty.</div>;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white text-sm shadow-sm">
      <div className="flex items-center justify-between bg-cream-deep px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-maroon">
        <span>Your cart</span>
        {cart.countryName && <span className="normal-case tracking-normal text-muted">to {cart.countryName}</span>}
      </div>
      <ul className="divide-y divide-line px-3">
        {cart.lines.map((l) => (
          <li key={l.product} className="flex justify-between gap-2 py-1.5">
            <span>
              {l.name} <span className="text-muted">({l.packSize}) × {l.quantity}</span>
            </span>
            <span className="tabular-nums">{l.lineTotal}</span>
          </li>
        ))}
      </ul>
      <dl className="space-y-0.5 border-t border-line px-3 py-2">
        <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{cart.subtotal}</dd></div>
        {cart.shipping && (
          <div className="flex justify-between">
            <dt>Shipping ({cart.weightKg} kg)</dt>
            <dd className={`tabular-nums ${cart.freeShipping ? "font-semibold text-leaf" : ""}`}>{cart.shipping}</dd>
          </div>
        )}
        {cart.total && (
          <div className="flex justify-between pt-1 text-base font-bold text-maroon">
            <dt>Total</dt>
            <dd className="tabular-nums">{cart.total} USD</dd>
          </div>
        )}
      </dl>
      {cart.warnings.length > 0 && (
        <div className="space-y-1 border-t border-line bg-turmeric/15 px-3 py-2 text-xs">
          {cart.warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      )}
    </div>
  );
}

/** Tiny formatter for the model's replies: paragraphs, "- " bullets and **bold**. No HTML injection (React escapes text). */
export function RichText({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter((l) => l.trim());
        const isList = lines.every((l) => /^\s*([-*•]|\d+\.)\s+/.test(l));
        if (isList) {
          return (
            <ul key={i} className="list-disc space-y-0.5 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{bold(l.replace(/^\s*([-*•]|\d+\.)\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {bold(l)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function bold(s: string) {
  return s.split(/(\*\*[^*]+\*\*)/g).map((seg, i) =>
    seg.startsWith("**") && seg.endsWith("**") ? <strong key={i}>{seg.slice(2, -2)}</strong> : <span key={i}>{seg}</span>,
  );
}
