import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { displayOrderNumber } from "@/lib/format";
import { SHIPPING_RATES, isSupportedCountry } from "@/lib/shipping";
import { Suspense } from "react";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Bill } from "@/components/bill/Bill";
import { ShopStamp } from "@/components/bill/ShopStamp";
import { PayPalCheckout } from "@/components/checkout/PayPalCheckout";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your bill · Bhausaheb Faral" };

const day = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
const dayShort = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" });

const STEPS = [
  { key: "NEW", label: "Order written" },
  { key: "PACKING", label: "Aai is packing" },
  { key: "SHIPPED", label: "Posted" },
  { key: "DELIVERED", label: "Reached you" },
] as const;

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  return `${user.slice(0, 2)}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`;
}

// The order id is an unguessable cuid, so the link itself is the access token (no customer accounts, PRD 6.3).
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: true } },
      events: { where: { type: "paid" }, orderBy: { createdAt: "asc" }, take: 1 },
    },
  });
  if (!order) notFound();

  const label = displayOrderNumber(order.number);
  const where = isSupportedCountry(order.shipCountry) ? SHIPPING_RATES[order.shipCountry].name : order.shipCountry;
  const paid = order.paymentStatus === "PAID";
  const paidOn = order.events[0]?.createdAt ?? order.updatedAt;
  const reached = STEPS.findIndex((s) => s.key === order.fulfilment);
  const first = order.customer.name.split(" ")[0];

  const stamp =
    order.paymentStatus === "PAID" ? (
      <ShopStamp label={`Stamped paid on ${dayShort.format(paidOn)}`} sub={`Paid, ${dayShort.format(paidOn)}`} />
    ) : order.paymentStatus === "REFUNDED" ? (
      <ShopStamp label="Stamped refunded" center="परत केले" sub="Refunded" />
    ) : null;

  return (
    <>
      <Suspense>
        <SiteHeader />
      </Suspense>
      <main className="mx-auto w-full max-w-[680px] flex-1 px-4 pb-16 pt-7 sm:px-6 sm:pt-9">
        <h1 className="type-title text-[30px] leading-[1.1] sm:text-[40px]">Bill {label}</h1>
        <p className="mt-2 text-lg text-muted">
          {paid
            ? `Thank you, ${first}. The money is in, so Aai can fry and pack your faral.`
            : order.paymentStatus === "AWAITING_PAYMENT"
              ? "This bill isn't paid yet."
              : order.paymentStatus === "REFUNDED"
                ? "This bill was refunded."
                : "This bill was cancelled. Nothing was charged."}
        </p>

        <div className="mt-6">
          <Bill
            label={`Bill ${label}`}
            number={String(order.number + 1000)}
            date={day.format(order.createdAt)}
            lines={order.items.map((it) => ({
              key: it.id,
              qty: it.quantity,
              name: it.product.name,
              nameMr: it.product.nameMarathi,
              pack: it.product.packSize,
              rateCents: it.unitCents,
              amountCents: it.unitCents * it.quantity,
            }))}
            postage={{ label: `Postage to ${where}`, cents: order.shippingCents, free: order.shippingCents === 0 }}
            totalCents={order.totalCents}
            stamp={stamp}
          >
            {order.paymentStatus === "AWAITING_PAYMENT" && order.paypalOrderId && (
              <PayPalCheckout orderId={order.id} orderNumber={label} paypalOrderId={order.paypalOrderId} totalCents={order.totalCents} />
            )}
          </Bill>
        </div>

        {paid && (
          <section aria-labelledby="parcel-steps" className="mt-10">
            <h2 id="parcel-steps" className="type-head border-b border-line pb-2 text-2xl">
              Where your parcel is
            </h2>
            <ol className="mt-1">
              {STEPS.map((s, i) => {
                const done = i <= reached;
                return (
                  <li key={s.key} className="flex items-baseline gap-3 border-b border-line py-3">
                    <span aria-hidden="true" className={`inline-block h-3 w-3 shrink-0 translate-y-[1px] border-[1.5px] border-accent ${done ? "bg-accent" : ""}`} />
                    <span className={done ? "font-semibold" : "text-muted"}>
                      {s.label}
                      <span className="sr-only">{done ? ", done" : ", not yet"}</span>
                    </span>
                    <span className="ml-auto text-right text-[15px] text-muted">
                      {s.key === "NEW" && day.format(order.createdAt)}
                      {s.key === "SHIPPED" && order.trackingNumber && `${order.carrier ?? ""} ${order.trackingNumber}`}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        <section aria-labelledby="parcel-for" className="mt-10 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 id="parcel-for" className="type-head text-xl">
              Parcel for
            </h2>
            <p className="mt-1">{order.shipName}</p>
            <p className="text-muted">
              {order.shipCity}
              {order.shipState ? `, ${order.shipState}` : ""}, {where}
            </p>
            <p className="text-muted">Tracking goes to {maskEmail(order.customer.email)}</p>
          </div>
          {order.giftMessage && (
            <div>
              <h2 className="type-head text-xl">Note inside</h2>
              <p className="mr mt-1 italic">&ldquo;{order.giftMessage}&rdquo;</p>
            </div>
          )}
        </section>

        <p className="mt-10">
          <Link href="/" className="font-semibold text-accent underline underline-offset-4">
            Continue shopping
          </Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
