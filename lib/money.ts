// All money is integer USD cents. Only format to decimals at the edges (UI, PayPal API).

/** 1234 -> "$12.34" */
export function formatUSD(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

/** 1234 -> "12.34" (PayPal `value` string). Throws on non-integer input to catch float bugs early. */
export function toPayPalValue(cents: number): string {
  if (!Number.isInteger(cents) || cents < 0) throw new Error(`Invalid cents amount: ${cents}`);
  return (cents / 100).toFixed(2);
}

/** "12.34" -> 1234 (parsing PayPal responses). */
export function fromPayPalValue(value: string): number {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) throw new Error(`Invalid PayPal amount: ${value}`);
  const [whole, frac = ""] = value.split(".");
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}
