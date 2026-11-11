// Owner write actions behind confirmation (PRD 8.3 rev 2).
// propose*: validates + prices everything on the server, stores a PendingAction, returns a card.
// executeAction: runs ONLY from the Confirm button (by id), with the stored server-built payload.
import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { packsForGrams } from "@/lib/cart";
import { formatUSD, toPayPalValue } from "@/lib/money";
import { displayOrderNumber, parseOrderNumber } from "@/lib/format";
import { isSupportedCountry, quoteShipping } from "@/lib/shipping";
import { setFulfilment } from "@/lib/owner/orders";
import { runToolkit, extractId, ToolkitError } from "@/lib/paypal-toolkit";
import type { Prisma } from "@/lib/generated/prisma/client";

const ACTION_TTL_MS = 30 * 60_000;

// ---------- Pricing (shared with the price_items read tool) ----------

export const itemRequestSchema = z.object({
  product: z.string().describe("Product slug, e.g. 'chakli'"),
  quantity: z.number().int().min(1).max(50).optional().describe("Packs"),
  grams: z.number().int().min(1).max(50000).optional().describe("Weight asked for, e.g. 1000 for 1 kg"),
});
export type ItemRequest = z.infer<typeof itemRequestSchema>;

export async function priceItems(items: ItemRequest[]) {
  const products = await db.product.findMany({ where: { slug: { in: items.map((i) => i.product) }, active: true } });
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const lines = [];
  const problems: string[] = [];
  for (const it of items) {
    const p = bySlug.get(it.product);
    if (!p) {
      problems.push(`Unknown product "${it.product}"`);
      continue;
    }
    const quantity = it.grams ? packsForGrams(it.grams, p.weightGrams) : (it.quantity ?? 1);
    lines.push({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      packSize: p.packSize,
      quantity,
      unitCents: p.priceCents,
      lineCents: p.priceCents * quantity,
      weightGrams: p.weightGrams * quantity,
      note: it.grams && quantity * p.weightGrams !== it.grams ? `${it.grams} g rounded up to ${quantity} × ${p.packSize}` : undefined,
    });
  }
  const subtotalCents = lines.reduce((s, l) => s + l.lineCents, 0);
  const weightGrams = lines.reduce((s, l) => s + l.weightGrams, 0);
  return { lines, subtotalCents, weightGrams, problems };
}

// ---------- Proposals ----------

export const proposalSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("update_fulfilment"),
    order: z.string().describe("Order number like #1027"),
    status: z.enum(["NEW", "PACKING", "SHIPPED", "DELIVERED"]),
    carrier: z.string().optional().describe("e.g. India Post, DHL"),
    trackingNumber: z.string().optional(),
  }),
  z.object({
    type: z.literal("create_invoice"),
    email: z.string().email(),
    name: z.string().optional().describe("Customer name, needed if they are not an existing customer"),
    country: z.string().optional().describe("ISO-2 shipping country, needed if they are not an existing customer"),
    items: z.array(itemRequestSchema).min(1),
    note: z.string().max(300).optional(),
  }),
]);
export type Proposal = z.infer<typeof proposalSchema>;

export type ActionCard =
  | { ok: true; actionId: string; type: Proposal["type"]; title: string; details: string[]; totalCents?: number }
  | { ok: false; problems: string[] };

const CARRIER_CODES: Record<string, string> = {
  "india post": "INDIA_POST",
  indiapost: "INDIA_POST",
  "speed post": "INDIA_POST",
  dhl: "DHL",
  fedex: "FEDEX",
  ups: "UPS",
  aramex: "ARAMEX",
  "blue dart": "BLUEDART",
  bluedart: "BLUEDART",
  dtdc: "DTDC",
};

export async function proposeAction(input: Proposal): Promise<ActionCard> {
  if (input.type === "update_fulfilment") {
    const n = parseOrderNumber(input.order);
    const order = n ? await db.order.findUnique({ where: { number: n }, include: { customer: true } }) : null;
    if (!order) return { ok: false, problems: [`No order ${input.order}.`] };
    const label = displayOrderNumber(order.number);
    if (order.paymentStatus !== "PAID" && input.status !== "NEW") {
      return { ok: false, problems: [`${label} is ${order.paymentStatus.replace("_", " ").toLowerCase()}, so it can't be marked ${input.status.toLowerCase()}.`] };
    }
    const carrier = input.carrier?.trim();
    const tracking = input.trackingNumber?.replace(/\s+/g, "").toUpperCase();
    const paypalTracking = !!(tracking && order.paypalCaptureId && order.paypalOrderId);
    const details = [`${label} · ${order.customer.name} · ${order.shipCountry}`, `Status: ${order.fulfilment} → ${input.status}`];
    if (tracking) details.push(`Tracking: ${carrier ?? "carrier?"} ${tracking}`);
    if (tracking) {
      details.push(
        paypalTracking
          ? "Will also add this tracking number to the PayPal transaction (buyer sees it in PayPal)."
          : "No PayPal payment on this order (demo data or unpaid): tracking is saved in our records only.",
      );
    }
    const payload = { orderId: order.id, status: input.status, carrier: carrier ?? null, trackingNumber: tracking ?? null };
    const pa = await db.pendingAction.create({
      data: { type: input.type, payload, summary: `Mark ${label} ${input.status.toLowerCase()}${tracking ? ` (${tracking})` : ""}` },
    });
    return { ok: true, actionId: pa.id, type: input.type, title: pa.summary, details };
  }

  // create_invoice: every amount from the DB, never from the model.
  const email = input.email.trim().toLowerCase();
  const priced = await priceItems(input.items);
  if (priced.problems.length) return { ok: false, problems: priced.problems };
  if (!priced.lines.length) return { ok: false, problems: ["No items to invoice."] };

  const customer = await db.customer.findUnique({ where: { email } });
  const name = customer?.name ?? input.name?.trim();
  const country = (customer?.country ?? input.country ?? "").toUpperCase();
  const problems: string[] = [];
  if (!name) problems.push("New customer: ask the owner for the customer's name.");
  if (!country) problems.push("New customer: ask the owner which country to ship to.");
  else if (!isSupportedCountry(country)) problems.push(`We don't ship to ${country}.`);
  if (problems.length) return { ok: false, problems };

  const quote = quoteShipping(country, priced.weightGrams, priced.subtotalCents);
  if (!quote.supported) return { ok: false, problems: [`We don't ship to ${country}.`] };

  const payload = {
    email,
    name: name!,
    country,
    lines: priced.lines.map(({ productId, name, packSize, quantity, unitCents }) => ({ productId, name, packSize, quantity, unitCents })),
    subtotalCents: priced.subtotalCents,
    shippingCents: quote.shippingCents,
    totalCents: quote.totalCents,
    note: input.note ?? null,
  };
  const details = [
    `To: ${name} <${email}>${customer ? "" : " (new customer)"} · ${country}`,
    ...priced.lines.map((l) => `${l.name} (${l.packSize}) × ${l.quantity} = ${formatUSD(l.lineCents)}${l.note ? ` · ${l.note}` : ""}`),
    `Shipping: ${quote.freeShipping ? "FREE" : formatUSD(quote.shippingCents)}`,
    `Total: ${formatUSD(quote.totalCents)} USD (prices from the shop database)`,
  ];
  const pa = await db.pendingAction.create({
    data: { type: input.type, payload, summary: `Send a PayPal invoice for ${formatUSD(quote.totalCents)} to ${email}` },
  });
  return { ok: true, actionId: pa.id, type: input.type, title: pa.summary, details, totalCents: quote.totalCents };
}

// ---------- Execution (Confirm button only) ----------

export type ActionResult = { status: "EXECUTED" | "FAILED" | "CANCELLED"; message: string };

export async function decideAction(actionId: string, decision: "confirm" | "cancel"): Promise<ActionResult> {
  const pa = await db.pendingAction.findUnique({ where: { id: actionId } });
  if (!pa) return { status: "FAILED", message: "Action not found." };

  // Already handled (double click, second tab): return the stored outcome, do nothing again.
  if (pa.status !== "PENDING") {
    const prev = (pa.result as { message?: string } | null)?.message;
    return { status: pa.status === "EXECUTED" ? "EXECUTED" : pa.status === "CANCELLED" ? "CANCELLED" : "FAILED", message: prev ?? `Already ${pa.status.toLowerCase()}.` };
  }

  if (decision === "cancel") {
    await db.pendingAction.updateMany({ where: { id: actionId, status: "PENDING" }, data: { status: "CANCELLED", result: { message: "Cancelled." } } });
    return { status: "CANCELLED", message: "Cancelled. Nothing was changed." };
  }

  if (Date.now() - pa.createdAt.getTime() > ACTION_TTL_MS) {
    await db.pendingAction.update({ where: { id: actionId }, data: { status: "CANCELLED", result: { message: "Expired." } } });
    return { status: "CANCELLED", message: "This action expired. Please ask again." };
  }

  // Atomic claim: only one request can move PENDING -> EXECUTED.
  const claimed = await db.pendingAction.updateMany({ where: { id: actionId, status: "PENDING" }, data: { status: "EXECUTED" } });
  if (claimed.count === 0) return decideAction(actionId, decision);

  try {
    const message = pa.type === "update_fulfilment" ? await runUpdateFulfilment(pa.payload) : await runCreateInvoice(pa.payload);
    await db.pendingAction.update({ where: { id: actionId }, data: { result: { message } } });
    return { status: "EXECUTED", message };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Action failed.";
    console.error("[owner action] failed", pa.type, err);
    await db.pendingAction.update({ where: { id: actionId }, data: { status: "FAILED", result: { message } } });
    return { status: "FAILED", message };
  }
}

async function runUpdateFulfilment(raw: Prisma.JsonValue): Promise<string> {
  const p = raw as { orderId: string; status: "NEW" | "PACKING" | "SHIPPED" | "DELIVERED"; carrier: string | null; trackingNumber: string | null };
  const updated = await setFulfilment(p.orderId, p.status, {
    carrier: p.carrier ?? undefined,
    trackingNumber: p.trackingNumber ?? undefined,
    actor: "owner assistant",
  });
  const label = displayOrderNumber(updated.number);
  let msg = `${label} marked ${p.status.toLowerCase()}.`;

  if (p.trackingNumber && updated.paypalCaptureId && updated.paypalOrderId) {
    const carrierCode = CARRIER_CODES[(p.carrier ?? "").toLowerCase()] ?? "OTHER";
    try {
      await runToolkit("create_shipment_tracking", {
        order_id: updated.paypalOrderId,
        transaction_id: updated.paypalCaptureId,
        tracking_number: p.trackingNumber,
        carrier: carrierCode,
        status: p.status === "DELIVERED" ? "DELIVERED" : "SHIPPED",
      });
      await db.orderEvent.create({ data: { orderId: updated.id, type: "tracking_added", message: `Tracking ${p.trackingNumber} added to PayPal (${carrierCode})` } });
      msg += ` Tracking ${p.trackingNumber} added to the PayPal transaction.`;
    } catch (err) {
      // The status change already succeeded; report the PayPal part honestly.
      msg += ` Saved tracking in our records, but PayPal didn't accept it: ${err instanceof ToolkitError ? err.message : "unknown error"}.`;
    }
  }
  return msg;
}

async function runCreateInvoice(raw: Prisma.JsonValue): Promise<string> {
  const p = raw as {
    email: string;
    name: string;
    country: string;
    lines: { productId: string; name: string; packSize: string; quantity: number; unitCents: number }[];
    subtotalCents: number;
    shippingCents: number;
    totalCents: number;
    note: string | null;
  };
  const [given, ...rest] = p.name.split(" ");

  const created = await runToolkit("create_invoice", {
    currency_code: "USD",
    invoicer_business_name: "Bhausaheb Faral",
    note: p.note ?? "Homemade Diwali faral from Karjat. Dhanyavaad! 🪔",
    primary_recipients: [{ billing_info: { name: { given_name: given, surname: rest.join(" ") || undefined }, email_address: p.email } }],
    items: p.lines.map((l) => ({
      name: `${l.name} (${l.packSize})`,
      quantity: String(l.quantity),
      unit_amount: { currency_code: "USD", value: toPayPalValue(l.unitCents) },
    })),
    ...(p.shippingCents > 0 ? { shipping_cost: toPayPalValue(p.shippingCents) } : {}),
  });
  const invoiceId = extractId(created);
  if (!invoiceId) throw new Error("PayPal created the invoice but returned no id.");

  await runToolkit("send_invoice", { invoice_id: invoiceId, send_to_recipient: true });

  // Record it as an order so it shows on the dashboard (address arrives with payment; not synced without webhook N6).
  const customer = await db.customer.upsert({
    where: { email: p.email },
    create: { email: p.email, name: p.name, country: p.country },
    update: {},
  });
  const last = await db.order.findFirst({ where: { customerId: customer.id }, orderBy: { createdAt: "desc" } });
  const order = await db.order.create({
    data: {
      customerId: customer.id,
      source: "invoice",
      subtotalCents: p.subtotalCents,
      shippingCents: p.shippingCents,
      totalCents: p.totalCents,
      shipName: p.name,
      shipLine1: last?.shipLine1 ?? "(address to confirm)",
      shipLine2: last?.shipLine2 ?? null,
      shipCity: last?.shipCity ?? "",
      shipState: last?.shipState ?? null,
      shipPostal: last?.shipPostal ?? "",
      shipCountry: p.country,
      paypalInvoiceId: invoiceId,
      items: { create: p.lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitCents: l.unitCents })) },
      events: {
        create: [
          { type: "created", message: "Created from a PayPal invoice (owner assistant)" },
          { type: "invoice_sent", message: `PayPal invoice ${invoiceId} sent to ${p.email}` },
        ],
      },
    },
  });
  return `Invoice ${invoiceId} for ${formatUSD(p.totalCents)} sent to ${p.email} (order ${displayOrderNumber(order.number)}).`;
}
