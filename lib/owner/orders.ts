// Order rows for the owner grid + detail drawer, and fulfilment updates (shared with the M5 assistant).
import "server-only";
import { db } from "@/lib/db";
import { displayOrderNumber } from "@/lib/format";
import type { FulfilmentStatus } from "@/lib/generated/prisma/client";

export async function listOrderRows(limit = 300) {
  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      customer: { select: { name: true, email: true } },
      items: { include: { product: { select: { name: true, nameMarathi: true, slug: true, packSize: true } } } },
      events: { orderBy: { createdAt: "asc" }, select: { type: true, message: true, createdAt: true } },
    },
  });
  return orders.map((o) => ({
    id: o.id,
    number: displayOrderNumber(o.number),
    numberValue: o.number + 1000,
    createdAt: o.createdAt.toISOString(),
    customer: o.customer.name,
    email: o.customer.email,
    country: o.shipCountry,
    items: o.items.map((i) => `${i.product.name} ×${i.quantity}`).join(", "),
    itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
    totalCents: o.totalCents,
    subtotalCents: o.subtotalCents,
    shippingCents: o.shippingCents,
    paymentStatus: o.paymentStatus,
    fulfilment: o.fulfilment,
    source: o.source,
    detail: {
      lines: o.items.map((i) => ({ slug: i.product.slug, name: i.product.name, nameMarathi: i.product.nameMarathi, packSize: i.product.packSize, quantity: i.quantity, unitCents: i.unitCents })),
      address: [o.shipName, o.shipLine1, o.shipLine2, [o.shipCity, o.shipState, o.shipPostal].filter(Boolean).join(" "), o.shipCountry]
        .filter(Boolean)
        .join("\n"),
      giftMessage: o.giftMessage,
      paypalOrderId: o.paypalOrderId,
      paypalCaptureId: o.paypalCaptureId,
      paypalInvoiceId: o.paypalInvoiceId,
      carrier: o.carrier,
      trackingNumber: o.trackingNumber,
      events: o.events.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })),
    },
  }));
}
export type OrderRow = Awaited<ReturnType<typeof listOrderRows>>[number];

const ORDER: FulfilmentStatus[] = ["NEW", "PACKING", "SHIPPED", "DELIVERED"];
const LABEL: Record<FulfilmentStatus, string> = { NEW: "New", PACKING: "Packing", SHIPPED: "Shipped", DELIVERED: "Delivered" };

/** Update fulfilment (+ optional tracking) and log an event. Only paid orders can move forward. */
export async function setFulfilment(
  orderId: string,
  fulfilment: FulfilmentStatus,
  opts: { carrier?: string; trackingNumber?: string; actor?: string } = {},
) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");
  if (order.paymentStatus !== "PAID" && fulfilment !== "NEW") {
    throw new Error(`Order ${displayOrderNumber(order.number)} is not paid (${order.paymentStatus}), so it can't be ${LABEL[fulfilment].toLowerCase()}.`);
  }
  const events: { type: string; message: string }[] = [];
  if (order.fulfilment !== fulfilment) {
    events.push({
      type: "status_changed",
      message: `${LABEL[order.fulfilment]} to ${LABEL[fulfilment]}${opts.actor ? ` (${opts.actor})` : ""}`,
    });
  }
  if (opts.trackingNumber) {
    events.push({ type: "tracking_added", message: `Tracking ${opts.carrier ?? ""} ${opts.trackingNumber}`.replace(/\s+/g, " ") });
  }
  return db.order.update({
    where: { id: orderId },
    data: {
      fulfilment,
      ...(opts.trackingNumber ? { trackingNumber: opts.trackingNumber, carrier: opts.carrier ?? order.carrier } : {}),
      events: { create: events },
    },
  });
}

export const FULFILMENT_ORDER = ORDER;
