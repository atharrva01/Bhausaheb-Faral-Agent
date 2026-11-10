// Checkout + capture service (PRD 9.1 rev 2). Shared by the cart UI (M2) and the chat agent's create_checkout (M3).
import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCart, clearCart } from "@/lib/cart";
import { quoteShipping, SUPPORTED_COUNTRIES, type CountryCode } from "@/lib/shipping";
import { validateAddress } from "@/lib/address";
import { displayOrderNumber } from "@/lib/format";
import { fromPayPalValue } from "@/lib/money";
import * as paypal from "@/lib/paypal";

// ---------- Input validation ----------

export const checkoutInputSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your full name").max(100),
    email: z.string().trim().toLowerCase().email("Please enter a valid email"),
    address: z.object({
      line1: z.string().trim().min(3, "Address line 1 is required").max(300),
      line2: z.string().trim().max(300).optional().nullable(),
      city: z.string().trim().min(2, "City is required").max(120),
      state: z.string().trim().max(120).optional().nullable(),
      postalCode: z.string().trim().max(60).optional().nullable(),
      country: z
        .string()
        .trim()
        .toUpperCase()
        .refine((c) => (SUPPORTED_COUNTRIES as string[]).includes(c), "Sorry, we don't ship there yet"),
    }),
    giftMessage: z.string().trim().max(200).optional().nullable(),
  })
  .superRefine((v, ctx) => {
    if (!(SUPPORTED_COUNTRIES as string[]).includes(v.address.country)) return;
    for (const issue of validateAddress(v.address.country as CountryCode, v.address.state, v.address.postalCode)) {
      ctx.addIssue({ code: "custom", path: ["address", issue.field], message: issue.message });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;

export class CheckoutError extends Error {
  constructor(
    public code: "EMPTY_CART" | "UNSUPPORTED_COUNTRY" | "RATE_LIMITED" | "PAYPAL_ERROR" | "NOT_FOUND" | "AMOUNT_MISMATCH" | "DECLINED",
    message: string,
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

// ---------- Simple per-session rate limit (in-memory is fine: abuse guard only) ----------

const checkoutLog = new Map<string, number[]>();
function rateLimit(sessionId: string) {
  const hourAgo = Date.now() - 3_600_000;
  const recent = (checkoutLog.get(sessionId) ?? []).filter((t) => t > hourAgo);
  if (recent.length >= 5) throw new CheckoutError("RATE_LIMITED", "Too many checkout attempts. Please try again in a while.");
  recent.push(Date.now());
  checkoutLog.set(sessionId, recent);
}

// ---------- Create ----------

export type CheckoutResult = {
  orderId: string;
  orderNumber: string;
  paypalOrderId: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
};

/** Builds the order from the SERVER cart (DB prices), stores it, and creates the PayPal order. */
export async function createCheckout(
  sessionId: string,
  rawInput: unknown,
  source: "chat" | "cart",
): Promise<CheckoutResult> {
  const input = checkoutInputSchema.parse(rawInput);
  const country = input.address.country;

  const cart = await getCart(sessionId);
  if (cart.lines.length === 0) throw new CheckoutError("EMPTY_CART", "The cart is empty.");

  const quote = quoteShipping(country, cart.weightGrams, cart.subtotalCents);
  if (!quote.supported) throw new CheckoutError("UNSUPPORTED_COUNTRY", "Sorry, we don't ship there yet.");

  rateLimit(sessionId);

  // A new checkout replaces this session's earlier unpaid attempt.
  const stale = await db.order.findMany({ where: { sessionId, paymentStatus: "AWAITING_PAYMENT" }, select: { id: true } });
  for (const s of stale) {
    await db.order.update({
      where: { id: s.id },
      data: {
        paymentStatus: "CANCELLED",
        events: { create: { type: "cancelled", message: "Replaced by a newer checkout from the same customer session" } },
      },
    });
  }

  const order = await db.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { email: input.email },
      create: { name: input.name, email: input.email, country },
      update: { name: input.name, country },
    });
    return tx.order.create({
      data: {
        customerId: customer.id,
        sessionId,
        source,
        subtotalCents: cart.subtotalCents,
        shippingCents: quote.shippingCents,
        totalCents: quote.totalCents,
        shipName: input.name,
        shipLine1: input.address.line1,
        shipLine2: input.address.line2 || null,
        shipCity: input.address.city,
        shipState: input.address.state ? input.address.state.toUpperCase() : null,
        shipPostal: input.address.postalCode ?? "",
        shipCountry: country,
        giftMessage: input.giftMessage || null,
        items: { create: cart.lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitCents: l.unitCents })) },
        events: { create: { type: "created", message: `Order placed via ${source}` } },
      },
    });
  });

  const label = displayOrderNumber(order.number);
  let ppOrder: paypal.PayPalOrder;
  try {
    ppOrder = await paypal.createOrder({
      orderId: order.id,
      orderNumberLabel: label,
      items: cart.lines.map((l) => ({ name: `${l.name} (${l.packSize})`, sku: l.slug, quantity: l.quantity, unitCents: l.unitCents })),
      subtotalCents: cart.subtotalCents,
      shippingCents: quote.shippingCents,
      totalCents: quote.totalCents,
      shipping: {
        fullName: input.name,
        line1: input.address.line1,
        line2: input.address.line2,
        city: input.address.city,
        state: input.address.state?.toUpperCase(),
        postalCode: input.address.postalCode || null,
        countryCode: country,
      },
    });
  } catch (err) {
    // No orphan AWAITING_PAYMENT rows.
    const detail = err instanceof paypal.PayPalError ? `${err.status} ${err.issue ?? ""}`.trim() : "unknown error";
    console.error("PayPal create order failed", err instanceof paypal.PayPalError ? err.details : err);
    await db.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "CANCELLED",
        events: { create: { type: "cancelled", message: `PayPal order creation failed (${detail})` } },
      },
    });
    throw new CheckoutError("PAYPAL_ERROR", "PayPal couldn't start the payment. Please check the address and try again.");
  }

  await db.order.update({ where: { id: order.id }, data: { paypalOrderId: ppOrder.id } });

  return {
    orderId: order.id,
    orderNumber: label,
    paypalOrderId: ppOrder.id,
    subtotalCents: cart.subtotalCents,
    shippingCents: quote.shippingCents,
    totalCents: quote.totalCents,
  };
}

// ---------- Capture ----------

export type CaptureResult = { status: "PAID" | "ALREADY_PAID"; orderId: string; orderNumber: string };

/**
 * Idempotent capture. Takes OUR order id; the PayPal order id comes from the DB, never from the client.
 */
export async function captureCheckout(orderId: string): Promise<CaptureResult> {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order || !order.paypalOrderId) throw new CheckoutError("NOT_FOUND", "Order not found.");
  const label = displayOrderNumber(order.number);
  if (order.paymentStatus === "PAID" || order.paymentStatus === "REFUNDED") {
    return { status: "ALREADY_PAID", orderId, orderNumber: label };
  }

  let ppOrder: paypal.PayPalOrder;
  try {
    ppOrder = await paypal.captureOrder(order.paypalOrderId, `capture-${order.id}`);
  } catch (err) {
    if (err instanceof paypal.PayPalError && err.issue === "ORDER_ALREADY_CAPTURED") {
      ppOrder = await paypal.getOrder(order.paypalOrderId);
    } else if (err instanceof paypal.PayPalError && err.issue === "INSTRUMENT_DECLINED") {
      throw new CheckoutError("DECLINED", "The payment method was declined. Please try another one.");
    } else {
      console.error("PayPal capture failed", err instanceof paypal.PayPalError ? err.details : err);
      throw new CheckoutError("PAYPAL_ERROR", "We couldn't complete the payment with PayPal. You have not been charged.");
    }
  }

  const capture = paypal.firstCapture(ppOrder);
  if (!capture || capture.status !== "COMPLETED") {
    await db.orderEvent.create({
      data: { orderId, type: "payment_issue", message: `PayPal capture status: ${capture?.status ?? ppOrder.status}` },
    });
    throw new CheckoutError("PAYPAL_ERROR", "PayPal has not completed this payment yet.");
  }

  const capturedCents = fromPayPalValue(capture.amount.value);
  if (capture.amount.currency_code !== "USD" || capturedCents !== order.totalCents) {
    await db.orderEvent.create({
      data: {
        orderId,
        type: "payment_issue",
        message: `Captured ${capture.amount.value} ${capture.amount.currency_code} but order total is ${order.totalCents / 100} USD`,
      },
    });
    throw new CheckoutError("AMOUNT_MISMATCH", "Payment amount did not match the order. The shop has been notified.");
  }

  await db.$transaction(async (tx) => {
    // Conditional update: only one concurrent capture request wins.
    const won = await tx.order.updateMany({
      where: { id: orderId, paymentStatus: { in: ["AWAITING_PAYMENT", "CANCELLED"] } },
      data: { paymentStatus: "PAID", paypalCaptureId: capture.id },
    });
    if (won.count === 0) return;

    const events: { type: string; message: string }[] = [
      { type: "paid", message: `Paid ${capture.amount.value} USD via PayPal (capture ${capture.id})` },
    ];
    if (order.paymentStatus === "CANCELLED") {
      events.push({ type: "payment_issue", message: "Payment arrived for an order that had been cancelled. Please review." });
    }
    for (const item of order.items) {
      const dec = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (dec.count === 0) {
        // Money is already taken: keep the order PAID, flag it for the owner.
        await tx.product.update({ where: { id: item.productId }, data: { stock: 0 } });
        events.push({ type: "stock_issue", message: `Not enough stock for ${item.quantity} pack(s) of a product. Please check before packing.` });
      }
    }
    await tx.orderEvent.createMany({ data: events.map((e) => ({ ...e, orderId })) });
  });

  if (order.sessionId) await clearCart(order.sessionId);
  return { status: "PAID", orderId, orderNumber: label };
}
