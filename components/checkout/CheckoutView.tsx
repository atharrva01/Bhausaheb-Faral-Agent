"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/shop/CartProvider";
import { PayPalCheckout } from "@/components/checkout/PayPalCheckout";
import { Bill } from "@/components/bill/Bill";
import { billFromCart } from "@/components/bill/cartToBill";
import { formatUSD } from "@/lib/money";
import { SHIPPING_RATES, SUPPORTED_COUNTRIES, FREE_SHIPPING_THRESHOLD_CENTS, type CountryCode } from "@/lib/shipping";
import { ADDRESS_RULES } from "@/lib/address";
import type { CheckoutResult } from "@/lib/checkout";

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

// Remembered per browser so nobody retypes an address (a convenience; the server validates everything).
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
    /* private mode */
  }
}

export default function CheckoutView() {
  const { cart, busy, error: cartError, setQuantity, setCountry } = useCart();
  const [details, setDetails] = useState<Details>(loadDetails);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Details | "form", string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ key: string; result: CheckoutResult } | null>(null);

  if (!cart) return <p className="mx-auto max-w-[1280px] px-4 py-16 text-pencil">Reading your bill…</p>;

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-14">
        <h1 className="type-title text-[30px] sm:text-[40px]">Your bill</h1>
        <p className="mt-3 text-lg">Nothing on the bill yet. Tell the counter what you&apos;d like, or add packets from today&apos;s rates.</p>
        <Link href="/" className="mt-6 inline-flex h-12 items-center rounded-[4px] border-[1.5px] border-ink px-5 font-semibold hover:bg-paper">
          Go to today&apos;s rates
        </Link>
      </div>
    );
  }

  const country = cart.country as CountryCode | null;
  const quote = cart.quote?.supported ? cart.quote : null;
  const rule = country ? ADDRESS_RULES[country] : null;
  const bill = billFromCart(cart);
  const stockOf = (id: string) => cart.lines.find((l) => l.productId === id)?.stock ?? 0;
  const toFree = FREE_SHIPPING_THRESHOLD_CENTS - cart.subtotalCents;

  // A PayPal order is only valid for the exact bill + address it was made from.
  const key = JSON.stringify([cart.lines.map((l) => [l.productId, l.quantity]), country, details]);
  const checkout = created?.key === key ? created.result : null;

  function update(field: keyof Details, value: string) {
    const next = { ...details, [field]: value };
    setDetails(next);
    saveDetails(next);
    if (fieldErrors[field]) setFieldErrors({ ...fieldErrors, [field]: undefined });
  }

  async function makeBill(e: React.FormEvent) {
    e.preventDefault();
    if (!country) return setFieldErrors({ form: "Choose where the parcel is going first." });
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
          postalCode: details.postalCode || null,
          country,
        },
        giftMessage: details.giftMessage || null,
      }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (res.ok) return setCreated({ key, result: json });

    const errs: typeof fieldErrors = {};
    for (const issue of (json.issues ?? []) as { path: string[]; message: string }[]) {
      const last = issue.path[issue.path.length - 1] as keyof Details;
      if (last in EMPTY && !errs[last]) errs[last] = issue.message;
    }
    if (Object.keys(errs).length === 0) {
      errs.form =
        json.error === "PAYPAL_ERROR"
          ? "PayPal couldn't open the payment. Check the address, especially state and ZIP, and press Make my bill again. Nothing was charged."
          : (json.message ?? "The bill couldn't be made. Try again.");
    }
    setFieldErrors(errs);
  }

  const field = (name: keyof Details, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`f-${name}`} className="mb-1 block text-[15px] font-semibold">
        {label}
      </label>
      <input
        id={`f-${name}`}
        {...props}
        name={name}
        value={details[name]}
        onChange={(e) => update(name, e.target.value)}
        aria-invalid={!!fieldErrors[name]}
        aria-describedby={fieldErrors[name] ? `e-${name}` : undefined}
        className={`h-12 w-full rounded-[3px] border-[1.5px] bg-paper px-3 text-base ${fieldErrors[name] ? "border-khata" : "border-pencil"}`}
      />
      {fieldErrors[name] && (
        <p id={`e-${name}`} className="mt-1 text-[15px] text-khata">
          {fieldErrors[name]}
        </p>
      )}
    </div>
  );

  const pay = (
    <div className="space-y-3">
      {fieldErrors.form && (
        <p role="alert" className="text-[15px] text-khata">
          {fieldErrors.form}
        </p>
      )}
      {checkout ? (
        <PayPalCheckout {...checkout} />
      ) : (
        <button
          type="submit"
          form="parcel-form"
          disabled={submitting || busy || !quote}
          className="h-12 w-full rounded-[4px] bg-stamp px-4 text-base font-semibold text-paper hover:bg-[#3f3168] disabled:bg-pencil/60"
        >
          {!quote ? "Choose where it's going" : submitting ? "Writing your bill…" : "Make my bill"}
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 pb-16 pt-7 sm:px-6 lg:pt-9">
      <h1 className="type-title text-[30px] leading-[1.1] sm:text-[40px]">Your bill</h1>
      <p className="mt-2 text-lg">Check the packets, tell us where the parcel goes, then pay with PayPal.</p>

      {cartError && <p role="alert" className="mt-3 text-khata">{cartError}</p>}

      <div className="mt-7 grid grid-cols-1 gap-x-10 gap-y-9 lg:grid-cols-12">
        {/* The bill: first on phones, sticky on the right on desktop. */}
        <div className="min-w-0 lg:col-span-5 lg:col-start-8 lg:row-start-1">
          <div className="lg:sticky lg:top-6">
            <Bill
              label="Your bill"
              number={checkout ? checkout.orderNumber.replace("#", "") : null}
              lines={bill.lines}
              postage={bill.postage}
              totalCents={bill.totalCents}
              onQtyChange={checkout ? undefined : (id, q) => setQuantity(id, q)}
              maxQty={stockOf}
              busy={busy}
            >
              <div className="space-y-4">
                {cart.warnings.map((w) => (
                  <p key={w} className="text-[15px] text-khata">{w}</p>
                ))}
                <p className="text-sm text-pencil">
                  {toFree > 0 ? `${formatUSD(toFree)} more and the postage is on us.` : "Postage is on us."}
                </p>
                <div className="hidden lg:block">{pay}</div>
              </div>
            </Bill>
          </div>
        </div>

        <form id="parcel-form" onSubmit={makeBill} noValidate className="min-w-0 lg:col-span-6 lg:row-start-1">
          <fieldset>
            <legend className="type-head w-full border-b-2 border-ink pb-2 text-2xl">Where is the parcel going?</legend>
            <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-[3px] border-[1.5px] border-ink sm:grid-cols-5" role="radiogroup" aria-label="Country">
              {SUPPORTED_COUNTRIES.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={country === c}
                  onClick={() => setCountry(c)}
                  disabled={busy}
                  className={`h-12 border-ink px-2 text-[15px] font-semibold ${i > 0 ? "sm:border-l-[1.5px]" : ""} ${i % 2 === 1 ? "border-l-[1.5px]" : ""} ${i >= 2 ? "border-t-[1.5px] sm:border-t-0" : ""} ${
                    country === c ? "bg-ink text-paper" : "bg-paper hover:bg-wall"
                  } ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`}
                >
                  {SHIPPING_RATES[c].name === "United States" ? "United States" : SHIPPING_RATES[c].short}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">{field("name", "Name on the parcel", { autoComplete: "name", required: true })}</div>
            <div className="sm:col-span-2">{field("email", "Email for the tracking number", { type: "email", autoComplete: "email", required: true })}</div>
            <div className="sm:col-span-2">{field("line1", "House and street", { autoComplete: "address-line1", required: true })}</div>
            <div className="sm:col-span-2">{field("line2", "Flat or apartment (optional)", { autoComplete: "address-line2" })}</div>
            {field("city", "City", { autoComplete: "address-level2", required: true })}
            {rule?.stateLabel
              ? field("state", rule.stateLabel, { autoComplete: "address-level1", placeholder: rule.statePlaceholder, required: true })
              : field("state", "Region or emirate (optional)", { autoComplete: "address-level1" })}
            {field("postalCode", rule?.postalLabel ?? "Postal code", {
              autoComplete: "postal-code",
              placeholder: rule?.postalPlaceholder,
              required: rule?.postalRequired ?? true,
            })}
            <div className="sm:col-span-2">
              {field("giftMessage", "A note to tuck in the parcel (optional)", { maxLength: 200, placeholder: "Happy Diwali, Aai-Baba" })}
            </div>
          </div>
          <p className="mt-3 text-[15px] text-pencil">We&apos;ll remember this address on this device.</p>

          {/* Phones/tablets: pay under the form. */}
          <div className="mt-7 lg:hidden">{pay}</div>
        </form>
      </div>
    </div>
  );
}
