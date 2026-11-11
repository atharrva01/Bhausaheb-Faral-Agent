import { formatUSD } from "@/lib/money";
import type { Kpis } from "@/lib/owner/stats";

export function KpiTiles({ kpis }: { kpis: Kpis }) {
  const tiles = [
    { label: "Orders today", value: String(kpis.ordersToday), hint: "India time" },
    { label: "Revenue today", value: formatUSD(kpis.revenueTodayCents), hint: "paid, USD" },
    { label: "Awaiting payment", value: String(kpis.pendingPayment), hint: "not paid yet", warn: kpis.pendingPayment > 0 },
    { label: "To pack", value: String(kpis.toPack), hint: "paid, not shipped", accent: true },
    { label: "Shipped", value: String(kpis.shipped), hint: "in transit" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((t) => (
        <div
          key={t.label}
          className={`rounded-2xl border p-4 ${t.accent ? "border-saffron bg-saffron/10" : "border-line bg-white"}`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t.label}</p>
          <p className={`mt-1 text-3xl font-bold tabular-nums ${t.warn ? "text-saffron" : "text-ink"}`}>{t.value}</p>
          <p className="text-xs text-muted">{t.hint}</p>
        </div>
      ))}
    </div>
  );
}
