// Server-side cart (PRD 8.2 rev 2). Prices ALWAYS come from the DB here; nothing from the client or the LLM.
import { z } from "zod";
import { db } from "@/lib/db";
import { quoteShipping, type ShippingQuote } from "@/lib/shipping";

export const MAX_QTY_PER_LINE = 20;

const storedItemsSchema = z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() }));
type StoredItem = z.infer<typeof storedItemsSchema>[number];

export type CartProduct = {
  id: string;
  slug: string;
  name: string;
  nameMarathi: string;
  packSize: string;
  weightGrams: number;
  priceCents: number;
  stock: number;
  imageUrl: string;
  active: boolean;
};

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  nameMarathi: string;
  packSize: string;
  imageUrl: string;
  quantity: number;
  unitCents: number;
  lineCents: number;
  weightGrams: number; // total for the line
  stock: number;
};

export type PricedCart = {
  lines: CartLine[];
  itemCount: number;
  subtotalCents: number;
  weightGrams: number;
  country: string | null;
  quote: ShippingQuote | null; // null until a country is chosen or cart is empty
  warnings: string[];
};

/** Pure pricing: stored items + DB products -> priced cart. Drops unknown/inactive products, clamps to stock. */
export function priceCart(
  items: StoredItem[],
  products: CartProduct[],
  country: string | null,
): { cart: PricedCart; normalized: StoredItem[] } {
  const byId = new Map(products.map((p) => [p.id, p]));
  const warnings: string[] = [];
  const lines: CartLine[] = [];
  const normalized: StoredItem[] = [];

  for (const item of items) {
    const p = byId.get(item.productId);
    if (!p || !p.active) {
      warnings.push("An item in your cart is no longer available and was removed.");
      continue;
    }
    if (p.stock <= 0) {
      warnings.push(`${p.name} is sold out and was removed from the cart.`);
      continue;
    }
    let quantity = Math.min(item.quantity, MAX_QTY_PER_LINE);
    if (quantity > p.stock) {
      warnings.push(`Only ${p.stock} pack(s) of ${p.name} left, so the quantity was reduced to ${p.stock}.`);
      quantity = p.stock;
    }
    normalized.push({ productId: p.id, quantity });
    lines.push({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      nameMarathi: p.nameMarathi,
      packSize: p.packSize,
      imageUrl: p.imageUrl,
      quantity,
      unitCents: p.priceCents,
      lineCents: p.priceCents * quantity,
      weightGrams: p.weightGrams * quantity,
      stock: p.stock,
    });
  }

  const subtotalCents = lines.reduce((s, l) => s + l.lineCents, 0);
  const weightGrams = lines.reduce((s, l) => s + l.weightGrams, 0);
  const quote = country && lines.length > 0 ? quoteShipping(country, weightGrams, subtotalCents) : null;

  return {
    cart: {
      lines,
      itemCount: lines.reduce((s, l) => s + l.quantity, 0),
      subtotalCents,
      weightGrams,
      country,
      quote,
      warnings: [...new Set(warnings)],
    },
    normalized,
  };
}

/** Packs needed for a weight request ("1 kg chakli" -> 4 x 250 g). Rounds up. */
export function packsForGrams(grams: number, packWeightGrams: number): number {
  return Math.max(1, Math.ceil(grams / packWeightGrams));
}

const productSelect = {
  id: true, slug: true, name: true, nameMarathi: true, packSize: true, weightGrams: true,
  priceCents: true, stock: true, imageUrl: true, active: true,
} as const;

async function load(sessionId: string) {
  const row = await db.cart.findUnique({ where: { sessionId } });
  const parsed = storedItemsSchema.safeParse(row?.items ?? []);
  return { items: parsed.success ? parsed.data : [], country: row?.country ?? null };
}

async function save(sessionId: string, items: StoredItem[], country: string | null) {
  await db.cart.upsert({
    where: { sessionId },
    create: { sessionId, items, country },
    update: { items, country },
  });
}

async function priceAndPersist(sessionId: string, items: StoredItem[], country: string | null, extraWarnings: string[] = []) {
  const ids = [...new Set(items.map((i) => i.productId))];
  const products = ids.length ? await db.product.findMany({ where: { id: { in: ids } }, select: productSelect }) : [];
  const { cart, normalized } = priceCart(items, products, country);
  await save(sessionId, normalized, country);
  cart.warnings = [...extraWarnings, ...cart.warnings];
  return cart;
}

export async function getCart(sessionId: string): Promise<PricedCart> {
  const { items, country } = await load(sessionId);
  return priceAndPersist(sessionId, items, country);
}

export type CartChange = { productId: string; quantity?: number; grams?: number };

/**
 * Apply changes. mode "set": quantity replaces the line (0 removes). mode "add": quantity is added.
 * `grams` is converted to whole packs server-side (rounded up) and reported in warnings.
 */
export async function updateCart(sessionId: string, changes: CartChange[], mode: "set" | "add" = "set"): Promise<PricedCart> {
  const { items, country } = await load(sessionId);
  const notes: string[] = [];

  const needGrams = changes.filter((c) => c.grams !== undefined).map((c) => c.productId);
  const gramProducts = needGrams.length
    ? await db.product.findMany({ where: { id: { in: needGrams } }, select: { id: true, name: true, packSize: true, weightGrams: true } })
    : [];

  const next = new Map(items.map((i) => [i.productId, i.quantity]));
  for (const change of changes) {
    let qty = change.quantity ?? 0;
    if (change.grams !== undefined) {
      const p = gramProducts.find((g) => g.id === change.productId);
      if (!p) continue;
      qty = packsForGrams(change.grams, p.weightGrams);
      const actual = qty * p.weightGrams;
      if (actual !== change.grams)
        notes.push(`${p.name} comes in ${p.packSize} packs, so ${change.grams} g was rounded to ${qty} pack(s) (${actual} g).`);
    }
    if (!Number.isInteger(qty) || qty < 0) continue;
    const current = next.get(change.productId) ?? 0;
    const target = mode === "add" ? current + qty : qty;
    if (target <= 0) next.delete(change.productId);
    else next.set(change.productId, target);
  }

  return priceAndPersist(
    sessionId,
    [...next].map(([productId, quantity]) => ({ productId, quantity })),
    country,
    notes,
  );
}

export async function setCartCountry(sessionId: string, country: string | null): Promise<PricedCart> {
  const { items } = await load(sessionId);
  return priceAndPersist(sessionId, items, country ? country.toUpperCase() : null);
}

export async function clearCart(sessionId: string) {
  await db.cart.deleteMany({ where: { sessionId } });
}
