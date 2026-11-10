import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatUSD } from "@/lib/money";
import { displayOrderNumber } from "@/lib/format";
import { SHIPPING_RATES, isSupportedCountry } from "@/lib/shipping";
import { PayPalCheckout } from "@/components/checkout/PayPalCheckout";

export const dynamic = "force-dynamic";

const PAYMENT_LABEL = {
  AWAITING_PAYMENT: { text: "Awaiting payment", cls: "bg-turmeric/30 text-ink" },
  PAID: { text: "Paid", cls: "bg-leaf text-white" },
  REFUNDED: { text: "Refunded", cls: "bg-ink/70 text-white" },
  CANCELLED: { text: "Cancelled", cls: "bg-ink/20 text-ink" },
} as const;

const STEPS = ["NEW", "PACKING", "SHIPPED", "DELIVERED"] as const;
const STEP_LABEL = { NEW: "Order received", PACKING: "Aai is packing", SHIPPED: "Shipped", DELIVERED: "Delivered" };

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  return `${user.slice(0, 2)}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`;
}

// The order id is an unguessable cuid, so the link itself is the access token (no customer accounts, PRD 6.3).
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: { customer: true, items: { include: { product: true } } },
  });
  if (!order) notFound();

  const label = displayOrderNumber(order.number);
  const payment = PAYMENT_LABEL[order.paymentStatus];
  const country = isSupportedCountry(order.shipCountry) ? SHIPPING_RATES[order.shipCountry] : null;
  const stepIndex = STEPS.indexOf(order.fulfilment);
  const paid = order.paymentStatus === "PAID";

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <p className="text-sm text-muted">Bhausaheb Faral</p>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl text-maroon">Order {label}</h1>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${payment.cls}`}>{payment.text}</span>
      </div>
      {paid && (
        <p className="mt-2 text-lg">
          Dhanyavaad, {order.customer.name.split(" ")[0]}! 🪔 Aai will start making your faral fresh.
        </p>
      )}

      {paid && (
        <ol className="mt-6 grid grid-cols-4 gap-2 text-center text-xs">
          {STEPS.map((s, i) => (
            <li key={s} className={`rounded-lg px-1 py-2 ${i <= stepIndex ? "bg-saffron text-white" : "bg-cream-deep text-muted"}`}>
              {STEP_LABEL[s]}
            </li>
          ))}
        </ol>
      )}
      {order.trackingNumber && (
        <p className="mt-3 text-sm">
          Tracking: <strong>{order.carrier}</strong> {order.trackingNumber}
        </p>
      )}

      {order.paymentStatus === "AWAITING_PAYMENT" && order.paypalOrderId && (
        <div className="mt-6">
          <PayPalCheckout orderId={order.id} orderNumber={label} paypalOrderId={order.paypalOrderId} totalCents={order.totalCents} />
        </div>
      )}

      <section className="mt-8 rounded-2xl border border-line bg-white/70 p-5">
        <h2 className="mb-3 font-semibold">Items</h2>
        <ul className="divide-y divide-line text-sm">
          {order.items.map((it) => (
            <li key={it.id} className="flex justify-between py-2">
              <span>
                {it.product.name} <span className="text-muted">({it.product.packSize}) × {it.quantity}</span>
              </span>
              <span className="tabular-nums">{formatUSD(it.unitCents * it.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{formatUSD(order.subtotalCents)}</dd></div>
          <div className="flex justify-between"><dt>Shipping</dt><dd className="tabular-nums">{order.shippingCents === 0 ? "FREE" : formatUSD(order.shippingCents)}</dd></div>
          <div className="flex justify-between text-base font-bold text-maroon"><dt>Total</dt><dd className="tabular-nums">{formatUSD(order.totalCents)} USD</dd></div>
        </dl>
      </section>

      <section className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white/70 p-5">
          <h2 className="mb-2 font-semibold">Shipping to</h2>
          <p>{order.shipName}</p>
          <p className="text-muted">
            {order.shipCity}
            {order.shipState ? `, ${order.shipState}` : ""} · {country ? country.name : order.shipCountry}
          </p>
          <p className="mt-1 text-muted">{maskEmail(order.customer.email)}</p>
        </div>
        {order.giftMessage && (
          <div className="rounded-2xl border border-line bg-white/70 p-5">
            <h2 className="mb-2 font-semibold">Gift message</h2>
            <p className="italic">“{order.giftMessage}”</p>
          </div>
        )}
      </section>

      <Link href="/" className="mt-8 inline-block text-maroon underline">
        ← Back to the shop
      </Link>
    </main>
  );
}
