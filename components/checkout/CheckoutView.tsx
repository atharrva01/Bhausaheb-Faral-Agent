"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/shop/CartProvider";
import { PayPalCheckout } from "@/components/checkout/PayPalCheckout";
import { formatUSD } from "@/lib/money";
import { SHIPPING_RATES, SUPPORTED_COUNTRIES, FREE_SHIPPING_THRESHOLD_CENTS, type CountryCode } from "@/lib/shipping";
import type { CheckoutResult } from "@/lib/checkout";
import { ADDRESS_RULES } from "@/lib/address";

type Details = {
  name: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  giftMessage: string;
};

const EMPTY: Details = { name: "", email: "", line1: "", line2: "", city: "", state: "", postalCode: "", giftMessage: "" };
const STORAGE_KEY = "bf-checkout-details-v1";

// Saved per browser so customers never retype their address (a convenience only; the server validates everything).
function loadDetails(): Details {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}
function saveDetails(d: Details) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    /* private mode etc. */
  }
}

export default function CheckoutView() {
  const { cart, busy, error: cartError, setQuantity, setCountry } = useCart();
  const [details, setDetails] = useState<Details>(loadDetails);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Details | "form", string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ key: string; result: CheckoutResult } | null>(null);

  if (!cart) return <p className="py-20 text-center text-muted">Loading your cart…</p>;

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="font-display text-3xl text-maroon">Your cart is empty</h1>
        <p className="mt-2 text-muted">Add some faral first. Chakli and besan ladoo are the favourites!</p>
        <Link href="/" className="mt-6 inline-block rounded-lg bg-maroon px-5 py-2.5 font-semibold text-cream">
          Browse faral
        </Link>
      </div>
    );
  }

  const country = cart.country as CountryCode | null;
  const quote = cart.quote?.supported ? cart.quote : null;
  const rule = country ? ADDRESS_RULES[country] : null;

  // A PayPal order is only valid for the exact cart + details it was created from.
  const key = JSON.stringify([cart.lines.map((l) => [l.productId, l.quantity]), country, details]);
  const checkout = created?.key === key ? created.result : null;

  function update(field: keyof Details, value: string) {
    const next = { ...details, [field]: value };
    setDetails(next);
    saveDetails(next);
    if (fieldErrors[field]) setFieldErrors({ ...fieldErrors, [field]: undefined });
  }

  async function continueToPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!country) return setFieldErrors({ form: "Choose where to ship first." });
    setSubmitting(true);
    setFieldErrors({});
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: details.name,
        email: details.email,
        address: {
          line1: details.line1,
          line2: details.line2 || null,
          city: details.city,
          state: details.state || null,
          postalCode: details.postalCode,
          country,
        },
        giftMessage: details.giftMessage || null,
      }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (res.ok) return setCreated({ key, result: json });

    // Map server validation issues onto fields.
    const errs: typeof fieldErrors = {};
    for (const issue of (json.issues ?? []) as { path: string[]; message: string }[]) {
      const last = issue.path[issue.path.length - 1] as keyof Details;
      if (last in EMPTY && !errs[last]) errs[last] = issue.message;
    }
    if (Object.keys(errs).length === 0) errs.form = json.message ?? "Could not start checkout.";
    setFieldErrors(errs);
  }

  const field = (name: keyof Details, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input
        {...props}
        name={name}
        value={details[name]}
        onChange={(e) => update(name, e.target.value)}
        aria-invalid={!!fieldErrors[name]}
        className={`w-full rounded-lg border bg-white px-3 py-2.5 outline-none transition focus:border-saffron focus:ring-2 focus:ring-saffron/20 ${
          fieldErrors[name] ? "border-red-500" : "border-line"
        }`}
      />
      {fieldErrors[name] && <span className="mt-1 block text-xs text-red-700">{fieldErrors[name]}</span>}
    </label>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <Link href="/" className="text-sm text-maroon underline-offset-2 hover:underline">
        ← Continue shopping
      </Link>
      <h1 className="mt-2 font-display text-3xl text-maroon sm:text-4xl">Checkout</h1>

      {(cart.warnings.length > 0 || cartError) && (
        <div className="mt-4 space-y-2">
          {cartError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{cartError}</p>}
          {cart.warnings.map((w) => (
            <p key={w} className="rounded-lg bg-turmeric/20 p-3 text-sm">{w}</p>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Left: items + shipping details */}
        <div className="space-y-6 lg:col-span-7">
          <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
            <h2 className="text-lg font-semibold">1. Your faral</h2>
            <ul className="mt-3 divide-y divide-line">
              {cart.lines.map((l) => (
                <li key={l.productId} className="flex items-center gap-3 py-3">
                  <Image src={l.imageUrl} alt="" width={72} height={54} className="shrink-0 rounded-lg bg-cream-deep" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-tight">{l.name}</p>
                    <p className="text-xs text-muted">
                      {l.packSize} · {formatUSD(l.unitCents)} each
                    </p>
                    <button
                      onClick={() => setQuantity(l.productId, 0)}
                      disabled={busy}
                      className="mt-1 text-xs text-muted underline hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex h-9 items-stretch overflow-hidden rounded-lg border border-line">
                    <button
                      onClick={() => setQuantity(l.productId, l.quantity - 1)}
                      disabled={busy}
                      className="w-9 text-lg font-bold text-maroon hover:bg-cream-deep"
                      aria-label={`One less ${l.name}`}
                    >
                      −
                    </button>
                    <span className="flex w-8 items-center justify-center tabular-nums">{l.quantity}</span>
                    <button
                      onClick={() => setQuantity(l.productId, l.quantity + 1)}
                      disabled={busy || l.quantity >= l.stock}
                      className="w-9 text-lg font-bold text-maroon hover:bg-cream-deep disabled:opacity-30"
                      aria-label={`One more ${l.name}`}
                    >
                      +
                    </button>
                  </div>
                  <span className="hidden w-20 text-right font-semibold tabular-nums sm:block">{formatUSD(l.lineCents)}</span>
                </li>
              ))}
            </ul>
          </section>

          <form id="checkout-form" onSubmit={continueToPayment} className="rounded-2xl border border-line bg-white p-4 sm:p-5">
            <h2 className="text-lg font-semibold">2. Where should we ship?</h2>

            <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Shipping country">
              {SUPPORTED_COUNTRIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={country === c}
                  onClick={() => setCountry(c)}
                  disabled={busy}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    country === c ? "border-maroon bg-maroon text-cream" : "border-line bg-cream hover:border-maroon"
                  }`}
                >
                  {SHIPPING_RATES[c].short}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              {country ? (
                <>
                  Shipping to <strong className="text-ink">{SHIPPING_RATES[country].name}</strong>. Shipping elsewhere? Not yet, sorry.
                </>
              ) : (
                "Pick a country to see shipping cost."
              )}
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">{field("name", "Full name", { autoComplete: "name", required: true })}</div>
              <div className="sm:col-span-2">
                {field("email", "Email (for your order updates)", { type: "email", autoComplete: "email", required: true })}
              </div>
              <div className="sm:col-span-2">{field("line1", "Street address", { autoComplete: "address-line1", required: true })}</div>
              <div className="sm:col-span-2">
                {field("line2", "Apartment, suite (optional)", { autoComplete: "address-line2" })}
              </div>
              {field("city", "City", { autoComplete: "address-level2", required: true })}
              {rule?.stateLabel
                ? field("state", rule.stateLabel, { autoComplete: "address-level1", placeholder: rule.statePlaceholder, required: true })
                : field("state", "Region / emirate (optional)", { autoComplete: "address-level1" })}
              {field("postalCode", rule?.postalLabel ?? "Postal code", {
                autoComplete: "postal-code",
                placeholder: rule?.postalPlaceholder,
                required: rule?.postalRequired ?? true,
              })}
              <div className="sm:col-span-2">
                {field("giftMessage", "Diwali gift message (optional)", { maxLength: 200, placeholder: "Happy Diwali Aai-Baba!" })}
              </div>
            </div>
            <p className="mt-3 text-xs text-muted">Saved on this device so you don&apos;t have to type it again.</p>
          </form>
        </div>

        {/* Right: summary + pay (sticky on desktop) */}
        <aside className="lg:col-span-5">
          <div className="space-y-4 rounded-2xl border border-line bg-white p-4 sm:p-5 lg:sticky lg:top-20">
            <h2 className="text-lg font-semibold">3. Pay</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal ({cart.itemCount} item{cart.itemCount === 1 ? "" : "s"})</dt>
                <dd className="tabular-nums">{formatUSD(cart.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>
                  Shipping{country ? ` to ${SHIPPING_RATES[country].short}` : ""}{" "}
                  <span className="text-muted">({(cart.weightGrams / 1000).toFixed(2)} kg)</span>
                </dt>
                <dd className="tabular-nums">
                  {quote ? (quote.freeShipping ? <span className="font-semibold text-leaf">FREE</span> : formatUSD(quote.shippingCents)) : "—"}
                </dd>
              </div>
              <FreeShippingBar subtotalCents={cart.subtotalCents} />
              <div className="flex justify-between border-t border-line pt-3 text-lg font-bold text-maroon">
                <dt>Total</dt>
                <dd className="tabular-nums">{quote ? `${formatUSD(quote.totalCents)} USD` : "Choose country"}</dd>
              </div>
            </dl>

            {fieldErrors.form && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{fieldErrors.form}</p>}

            {checkout ? (
              <PayPalCheckout {...checkout} />
            ) : (
              <button
                type="submit"
                form="checkout-form"
                disabled={submitting || busy || !quote}
                className="w-full rounded-xl bg-maroon py-3.5 text-base font-semibold text-cream transition hover:bg-maroon-dark disabled:opacity-50"
              >
                {!quote ? "Choose a shipping country" : submitting ? "Preparing PayPal…" : created ? "Update & continue to payment" : "Continue to payment"}
              </button>
            )}
            <p className="text-center text-xs text-muted">Secure payment by PayPal. You can review everything before you pay.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function FreeShippingBar({ subtotalCents }: { subtotalCents: number }) {
  if (subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS) {
    return <p className="rounded-lg bg-leaf/10 px-3 py-2 text-xs font-semibold text-leaf">You get free shipping! 🎉</p>;
  }
  const pct = Math.round((subtotalCents / FREE_SHIPPING_THRESHOLD_CENTS) * 100);
  return (
    <div className="rounded-lg bg-cream px-3 py-2">
      <p className="text-xs">
        Add <strong>{formatUSD(FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents)}</strong> more for free shipping
      </p>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-saffron" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
