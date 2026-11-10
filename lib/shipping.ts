// Flat-rate international shipping (PRD 7.2). Placeholder numbers; all values in USD cents.

export type CountryCode = "US" | "CA" | "GB" | "AE" | "AU";

type Rate = { name: string; short: string; baseCents: number; extraPer500gCents: number };

export const SHIPPING_RATES: Record<CountryCode, Rate> = {
  US: { name: "United States", short: "USA", baseCents: 1800, extraPer500gCents: 600 },
  CA: { name: "Canada", short: "Canada", baseCents: 1800, extraPer500gCents: 600 },
  GB: { name: "United Kingdom", short: "UK", baseCents: 1600, extraPer500gCents: 500 },
  AE: { name: "United Arab Emirates", short: "UAE", baseCents: 1200, extraPer500gCents: 400 },
  AU: { name: "Australia", short: "Australia", baseCents: 2000, extraPer500gCents: 700 },
};

export const SUPPORTED_COUNTRIES = Object.keys(SHIPPING_RATES) as CountryCode[];

const BASE_WEIGHT_GRAMS = 1000;
const EXTRA_BLOCK_GRAMS = 500;
export const FREE_SHIPPING_THRESHOLD_CENTS = 10000; // $100 subtotal

export function isSupportedCountry(code: string): code is CountryCode {
  return code.toUpperCase() in SHIPPING_RATES;
}

export type ShippingQuote =
  | { supported: false; country: string }
  | {
      supported: true;
      country: CountryCode;
      weightGrams: number;
      shippingCents: number;
      freeShipping: boolean;
      subtotalCents: number;
      totalCents: number;
    };

/**
 * Base rate covers up to 1 kg; each *started* 500 g block above that adds the extra rate.
 * Free shipping when subtotal >= $100.
 */
export function quoteShipping(country: string, weightGrams: number, subtotalCents: number): ShippingQuote {
  const code = country.toUpperCase();
  if (!isSupportedCountry(code)) return { supported: false, country: code };
  if (!Number.isInteger(weightGrams) || weightGrams < 0) throw new Error(`Invalid weight: ${weightGrams}`);
  if (!Number.isInteger(subtotalCents) || subtotalCents < 0) throw new Error(`Invalid subtotal: ${subtotalCents}`);

  const rate = SHIPPING_RATES[code];
  const extraBlocks = Math.max(0, Math.ceil((weightGrams - BASE_WEIGHT_GRAMS) / EXTRA_BLOCK_GRAMS));
  const freeShipping = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS;
  const shippingCents = freeShipping ? 0 : rate.baseCents + extraBlocks * rate.extraPer500gCents;

  return {
    supported: true,
    country: code,
    weightGrams,
    shippingCents,
    freeShipping,
    subtotalCents,
    totalCents: subtotalCents + shippingCents,
  };
}
