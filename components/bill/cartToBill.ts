import type { PricedCart } from "@/lib/cart";
import type { CartView } from "@/lib/ai/customer-tools";
import type { BillLine } from "@/components/bill/Bill";
import { SHIPPING_RATES, isSupportedCountry } from "@/lib/shipping";

/** Server cart (rate board / checkout) -> bill props. */
export function billFromCart(cart: PricedCart) {
  const q = cart.quote?.supported ? cart.quote : null;
  const where = cart.country && isSupportedCountry(cart.country) ? SHIPPING_RATES[cart.country].name : null;
  const kg = (cart.weightGrams / 1000).toFixed(2);
  return {
    lines: cart.lines.map<BillLine>((l) => ({
      key: l.productId,
      qty: l.quantity,
      name: l.name,
      nameMr: l.nameMarathi,
      pack: l.packSize,
      rateCents: l.unitCents,
      amountCents: l.lineCents,
    })),
    postage: { label: where ? `Postage to ${where}, ${kg} kg` : `Postage, ${kg} kg`, cents: q ? q.shippingCents : null, free: q?.freeShipping },
    totalCents: q ? q.totalCents : cart.subtotalCents,
    hasCountry: !!q,
  };
}

/** Agent tool result (CartView) -> bill props. */
export function billFromCartView(v: CartView) {
  return {
    lines: v.lines.map<BillLine>((l) => ({
      key: l.product,
      qty: l.quantity,
      name: l.name,
      nameMr: l.nameMarathi,
      pack: l.packSize,
      rateCents: l.unitCents,
      amountCents: l.lineCents,
    })),
    postage: { label: v.countryName ? `Postage to ${v.countryName}, ${v.weightKg} kg` : `Postage, ${v.weightKg} kg`, cents: v.shippingCents, free: v.freeShipping },
    totalCents: v.totalCents ?? v.subtotalCents,
  };
}
