// Display helpers shared by UI and AI tools.

const ORDER_NUMBER_OFFSET = 1000;

/** DB number 12 -> "#1012" */
export function displayOrderNumber(number: number): string {
  return `#${number + ORDER_NUMBER_OFFSET}`;
}

/** "#1012", "1012" or 1012 -> DB number 12. Returns null if it can't be a valid order number. */
export function parseOrderNumber(input: string | number): number | null {
  const n = typeof input === "number" ? input : Number(String(input).replace(/[^\d]/g, ""));
  if (!Number.isInteger(n) || n <= ORDER_NUMBER_OFFSET) return null;
  return n - ORDER_NUMBER_OFFSET;
}

export const IST_TIMEZONE = "Asia/Kolkata";

/** Start of "today" in IST, as a UTC Date. Server runs in UTC on Render; Aai lives in IST. */
export function startOfDayIST(date: Date = new Date()): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date); // "2026-11-10"
  return new Date(`${ymd}T00:00:00+05:30`);
}
