import { describe, expect, it } from "vitest";
import { quoteShipping } from "./shipping";
import { fromPayPalValue, toPayPalValue } from "./money";
import { displayOrderNumber, parseOrderNumber, startOfDayIST } from "./format";

describe("quoteShipping", () => {
  it("charges base rate up to 1 kg", () => {
    const q = quoteShipping("US", 1000, 4000);
    expect(q).toMatchObject({ supported: true, shippingCents: 1800, totalCents: 5800 });
  });

  it("charges per started 500 g block above 1 kg", () => {
    expect(quoteShipping("US", 1001, 4000)).toMatchObject({ shippingCents: 2400 });
    expect(quoteShipping("US", 1500, 4000)).toMatchObject({ shippingCents: 2400 });
    expect(quoteShipping("US", 1501, 4000)).toMatchObject({ shippingCents: 3000 });
    expect(quoteShipping("GB", 2250, 4000)).toMatchObject({ shippingCents: 1600 + 3 * 500 });
  });

  it("is case-insensitive and rejects unsupported countries", () => {
    expect(quoteShipping("ae", 500, 1000)).toMatchObject({ supported: true, country: "AE", shippingCents: 1200 });
    expect(quoteShipping("BR", 500, 1000)).toEqual({ supported: false, country: "BR" });
  });

  it("gives free shipping when subtotal is $100 or more", () => {
    expect(quoteShipping("AU", 5000, 10000)).toMatchObject({ freeShipping: true, shippingCents: 0, totalCents: 10000 });
    expect(quoteShipping("AU", 500, 9999)).toMatchObject({ freeShipping: false, shippingCents: 2000 });
  });

  it("rejects non-integer inputs", () => {
    expect(() => quoteShipping("US", 100.5, 1000)).toThrow();
    expect(() => quoteShipping("US", 100, 10.5)).toThrow();
  });
});

describe("money", () => {
  it("round-trips PayPal values", () => {
    expect(toPayPalValue(1234)).toBe("12.34");
    expect(toPayPalValue(900)).toBe("9.00");
    expect(fromPayPalValue("12.34")).toBe(1234);
    expect(fromPayPalValue("9")).toBe(900);
    expect(fromPayPalValue("9.5")).toBe(950);
    expect(() => toPayPalValue(12.5)).toThrow();
  });
});

describe("order numbers and IST dates", () => {
  it("offsets order numbers by 1000", () => {
    expect(displayOrderNumber(12)).toBe("#1012");
    expect(parseOrderNumber("#1012")).toBe(12);
    expect(parseOrderNumber("order 1012")).toBe(12);
    expect(parseOrderNumber("12")).toBeNull();
  });

  it("computes start of day in IST", () => {
    // 2026-11-10 20:00 UTC is already Nov 11 01:30 IST
    expect(startOfDayIST(new Date("2026-11-10T20:00:00Z")).toISOString()).toBe("2026-11-10T18:30:00.000Z");
    expect(startOfDayIST(new Date("2026-11-10T10:00:00Z")).toISOString()).toBe("2026-11-09T18:30:00.000Z");
  });
});
