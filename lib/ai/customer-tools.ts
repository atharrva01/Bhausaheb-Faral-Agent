// Customer ordering agent tools (PRD 8.2). The model chooses WHAT (product slugs, quantities, address).
// The server decides HOW MUCH: no tool accepts a price, and every amount comes from the DB.
import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCart, updateCart, setCartCountry, type PricedCart } from "@/lib/cart";
import { createCheckout, CheckoutError } from "@/lib/checkout";
import { formatUSD } from "@/lib/money";
import { displayOrderNumber, parseOrderNumber } from "@/lib/format";
import { SHIPPING_RATES, SUPPORTED_COUNTRIES, isSupportedCountry } from "@/lib/shipping";

/** Compact, model-friendly cart (formatted strings) + cents for the UI card. */
export function cartView(cart: PricedCart) {
  const q = cart.quote?.supported ? cart.quote : null;
  return {
    lines: cart.lines.map((l) => ({
      product: l.slug,
      name: l.name,
      nameMarathi: l.nameMarathi,
      packSize: l.packSize,
      quantity: l.quantity,
      unitPrice: formatUSD(l.unitCents),
      lineTotal: formatUSD(l.lineCents),
      lineCents: l.lineCents,
      unitCents: l.unitCents,
    })),
    itemCount: cart.itemCount,
    subtotal: formatUSD(cart.subtotalCents),
    subtotalCents: cart.subtotalCents,
    weightKg: Number((cart.weightGrams / 1000).toFixed(2)),
    country: cart.country,
    countryName: cart.country && isSupportedCountry(cart.country) ? SHIPPING_RATES[cart.country].name : null,
    shipping: q ? (q.freeShipping ? "FREE" : formatUSD(q.shippingCents)) : null,
    shippingCents: q?.shippingCents ?? null,
    total: q ? formatUSD(q.totalCents) : null,
    totalCents: q?.totalCents ?? null,
    freeShipping: q?.freeShipping ?? false,
    warnings: cart.warnings,
  };
}
export type CartView = ReturnType<typeof cartView>;

async function slugToId(slugs: string[]) {
  const rows = await db.product.findMany({ where: { slug: { in: slugs }, active: true }, select: { id: true, slug: true } });
  return new Map(rows.map((r) => [r.slug, r.id]));
}

const countrySchema = z
  .string()
  .describe(`ISO-2 country code. Supported: ${SUPPORTED_COUNTRIES.join(", ")} (UK is GB, UAE is AE).`);

export function customerTools(sessionId: string) {
  return {
    get_product: tool({
      description: "Full details of one product: ingredients, allergens, spice level, shelf life, stock.",
      inputSchema: z.object({ product: z.string().describe("Product slug from the catalog, e.g. 'chakli'") }),
      execute: async ({ product }) => {
        const p = await db.product.findFirst({ where: { slug: product, active: true } });
        if (!p) return { found: false as const, message: `No product '${product}'. Use a slug from the catalog.` };
        return {
          found: true as const,
          product: p.slug,
          name: p.name,
          nameMarathi: p.nameMarathi,
          description: p.description,
          ingredients: p.ingredients,
          packSize: p.packSize,
          price: formatUSD(p.priceCents),
          spiceLevel: p.spiceLevel,
          vegetarian: p.isVeg,
          eggless: true,
          shelfLifeDays: p.shelfLifeDays,
          inStock: p.stock > 0,
          packsLeft: p.stock,
        };
      },
    }),

    update_cart: tool({
      description:
        "Set quantities in the customer's cart (replaces the quantity for each listed product; 0 removes it). " +
        "Use `grams` when the customer asks by weight (e.g. '1 kilo chakli' -> grams: 1000); the server converts to whole packs. " +
        "Returns the cart with server prices. Products not listed are left unchanged.",
      inputSchema: z.object({
        items: z
          .array(
            z.object({
              product: z.string().describe("Product slug from the catalog"),
              quantity: z.number().int().min(0).max(20).optional().describe("Number of packs"),
              grams: z.number().int().min(1).max(20000).optional().describe("Requested weight in grams, instead of quantity"),
            }),
          )
          .min(1),
      }),
      execute: async ({ items }) => {
        const ids = await slugToId(items.map((i) => i.product));
        const unknown = items.filter((i) => !ids.has(i.product)).map((i) => i.product);
        const changes = items
          .filter((i) => ids.has(i.product) && (i.quantity !== undefined || i.grams !== undefined))
          .map((i) => ({ productId: ids.get(i.product)!, quantity: i.quantity, grams: i.grams }));
        const cart = changes.length ? await updateCart(sessionId, changes, "set") : await getCart(sessionId);
        const view = cartView(cart);
        if (unknown.length) view.warnings.unshift(`Unknown product(s): ${unknown.join(", ")}. Use catalog slugs.`);
        return view;
      },
    }),

    get_cart: tool({
      description: "Show the customer's current cart with server prices (and shipping/total if a country is set).",
      inputSchema: z.object({}),
      execute: async () => cartView(await getCart(sessionId)),
    }),

    quote_shipping: tool({
      description: "Set the shipping country and get shipping cost + total for the current cart.",
      inputSchema: z.object({ country: countrySchema }),
      execute: async ({ country }) => {
        const code = country.trim().toUpperCase() === "UK" ? "GB" : country.trim().toUpperCase();
        if (!isSupportedCountry(code)) {
          return { supported: false as const, message: `We don't ship to ${country} yet. We ship to the US, Canada, UK, UAE and Australia.` };
        }
        return { supported: true as const, ...cartView(await setCartCountry(sessionId, code)) };
      },
    }),

    create_checkout: tool({
      description:
        "Create the order and a PayPal payment for the CURRENT CART. Only call after showing the cart summary with total " +
        "and the customer explicitly said yes. Amounts are computed by the server from the cart.",
      inputSchema: z.object({
        customerConfirmed: z.literal(true).describe("true only if the customer explicitly confirmed the summary"),
        name: z.string(),
        email: z.string(),
        address: z.object({
          line1: z.string(),
          line2: z.string().optional(),
          city: z.string(),
          state: z.string().optional().describe("State/province code: required for US, CA, AU (e.g. NJ, ON, NSW)"),
          postalCode: z.string().optional().describe("ZIP / postal code (not needed for UAE)"),
          country: countrySchema,
        }),
        giftMessage: z.string().max(200).optional(),
      }),
      // customerConfirmed is a schema-level guard (must be literal true); it is not forwarded.
      execute: async ({ customerConfirmed, ...input }) => {
        if (customerConfirmed !== true) return { ok: false as const, problems: ["Ask the customer to confirm the summary first."] };
        try {
          const country = input.address.country.trim().toUpperCase() === "UK" ? "GB" : input.address.country;
          const r = await createCheckout(sessionId, { ...input, address: { ...input.address, country } }, "chat");
          return {
            ok: true as const,
            orderId: r.orderId,
            orderNumber: r.orderNumber,
            paypalOrderId: r.paypalOrderId,
            totalCents: r.totalCents,
            total: formatUSD(r.totalCents),
            message: "The PayPal button is now shown in the chat, just above your reply. Ask them to pay with it.",
          };
        } catch (err) {
          if (err instanceof z.ZodError) {
            return { ok: false as const, problems: err.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
          }
          if (err instanceof CheckoutError) return { ok: false as const, problems: [err.message] };
          throw err;
        }
      },
    }),

    get_order_status: tool({
      description: "Look up an order's status by order number (e.g. #1027) and the email used to place it.",
      inputSchema: z.object({ orderNumber: z.string(), email: z.string() }),
      execute: async ({ orderNumber, email }) => {
        const n = parseOrderNumber(orderNumber);
        const order = n
          ? await db.order.findUnique({ where: { number: n }, include: { customer: { select: { email: true } } } })
          : null;
        // Same response for "not found" and "wrong email" so order numbers can't be probed.
        if (!order || order.customer.email.toLowerCase() !== email.trim().toLowerCase()) {
          return { found: false as const, message: "No order matches that number and email." };
        }
        return {
          found: true as const,
          orderNumber: displayOrderNumber(order.number),
          payment: order.paymentStatus,
          fulfilment: order.fulfilment,
          carrier: order.carrier,
          trackingNumber: order.trackingNumber,
          total: formatUSD(order.totalCents),
        };
      },
    }),
  };
}

export type CustomerTools = ReturnType<typeof customerTools>;
