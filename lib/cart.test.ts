import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} })); // priceCart is pure; db is not touched
const { priceCart, packsForGrams } = await import("./cart");

const p = (id: string, priceCents: number, stock: number, weightGrams = 250, active = true) => ({
  id, slug: id, name: id, nameMarathi: id, packSize: `${weightGrams} g`, weightGrams, priceCents, stock, imageUrl: "", active,
});

describe("priceCart", () => {
  it("prices from DB products and quotes shipping", () => {
    const { cart } = priceCart(
      [{ productId: "chakli", quantity: 2 }, { productId: "ladoo", quantity: 1 }],
      [p("chakli", 900, 10), p("ladoo", 1400, 10, 500)],
      "US",
    );
    expect(cart.subtotalCents).toBe(3200);
    expect(cart.weightGrams).toBe(1000);
    expect(cart.itemCount).toBe(3);
    expect(cart.quote).toMatchObject({ supported: true, shippingCents: 1800, totalCents: 5000 });
  });

  it("drops sold-out/unknown/inactive items and clamps to stock with warnings", () => {
    const { cart, normalized } = priceCart(
      [
        { productId: "gone", quantity: 1 },
        { productId: "soldout", quantity: 1 },
        { productId: "off", quantity: 1 },
        { productId: "few", quantity: 9 },
      ],
      [p("soldout", 100, 0), p("off", 100, 5, 250, false), p("few", 100, 3)],
      null,
    );
    expect(normalized).toEqual([{ productId: "few", quantity: 3 }]);
    expect(cart.quote).toBeNull();
    expect(cart.warnings).toHaveLength(3);
  });
});

describe("packsForGrams", () => {
  it("rounds up to whole packs", () => {
    expect(packsForGrams(1000, 250)).toBe(4);
    expect(packsForGrams(1000, 500)).toBe(2);
    expect(packsForGrams(600, 500)).toBe(2);
    expect(packsForGrams(100, 500)).toBe(1);
  });
});
