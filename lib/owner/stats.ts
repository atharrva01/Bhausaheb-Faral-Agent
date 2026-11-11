// Owner-side numbers (dashboard KPIs, AI summary input, owner assistant). All "today"/"week" in Asia/Kolkata.
import "server-only";
import { db } from "@/lib/db";
import { startOfDayIST } from "@/lib/format";
import { displayOrderNumber } from "@/lib/format";
import { formatUSD } from "@/lib/money";

export const LOW_STOCK_THRESHOLD = 5;

export async function getKpis() {
  const today = startOfDayIST();
  const [ordersToday, revenueToday, pendingPayment, toPack, shipped] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: today }, paymentStatus: { not: "CANCELLED" } } }),
    db.order.aggregate({ where: { createdAt: { gte: today }, paymentStatus: "PAID" }, _sum: { totalCents: true } }),
    db.order.count({ where: { paymentStatus: "AWAITING_PAYMENT" } }),
    db.order.count({ where: { paymentStatus: "PAID", fulfilment: { in: ["NEW", "PACKING"] } } }),
    db.order.count({ where: { fulfilment: "SHIPPED" } }),
  ]);
  return {
    ordersToday,
    revenueTodayCents: revenueToday._sum.totalCents ?? 0,
    pendingPayment,
    toPack,
    shipped,
  };
}
export type Kpis = Awaited<ReturnType<typeof getKpis>>;

/** Revenue/orders over a window of whole IST days ending today (days=1 means today only). */
export async function salesStats(days: number) {
  const from = new Date(startOfDayIST().getTime() - (days - 1) * 86_400_000);
  const paid = await db.order.findMany({
    where: { createdAt: { gte: from }, paymentStatus: "PAID" },
    select: { totalCents: true, createdAt: true, shipCountry: true, items: { select: { quantity: true, unitCents: true, product: { select: { name: true, nameMarathi: true } } } } },
  });

  const byProduct = new Map<string, { packs: number; revenueCents: number; nameMarathi: string }>();
  const byCountry = new Map<string, number>();
  for (const o of paid) {
    byCountry.set(o.shipCountry, (byCountry.get(o.shipCountry) ?? 0) + 1);
    for (const it of o.items) {
      const cur = byProduct.get(it.product.name) ?? { packs: 0, revenueCents: 0, nameMarathi: it.product.nameMarathi };
      cur.packs += it.quantity;
      cur.revenueCents += it.quantity * it.unitCents;
      byProduct.set(it.product.name, cur);
    }
  }
  const bestSellers = [...byProduct]
    .sort((a, b) => b[1].packs - a[1].packs)
    .slice(0, 3)
    .map(([name, v]) => ({ name, nameMarathi: v.nameMarathi, packs: v.packs, revenue: formatUSD(v.revenueCents) }));

  const revenueCents = paid.reduce((s, o) => s + o.totalCents, 0);
  return {
    days,
    paidOrders: paid.length,
    revenue: formatUSD(revenueCents),
    revenueCents,
    bestSellers,
    ordersByCountry: Object.fromEntries(byCountry),
  };
}

/** Everything the daily AI summary needs, as compact JSON (no customer emails/addresses). */
export async function summaryInput() {
  const [kpis, today, week, unpaid, packQueue, lowStock] = await Promise.all([
    getKpis(),
    salesStats(1),
    salesStats(7),
    db.order.findMany({
      where: { paymentStatus: "AWAITING_PAYMENT" },
      orderBy: { createdAt: "asc" },
      take: 5,
      select: { number: true, totalCents: true, customer: { select: { name: true } } },
    }),
    db.order.findMany({
      where: { paymentStatus: "PAID", fulfilment: { in: ["NEW", "PACKING"] } },
      orderBy: { createdAt: "asc" },
      take: 5,
      select: { number: true, shipCountry: true, fulfilment: true, items: { select: { quantity: true, product: { select: { name: true, nameMarathi: true } } } } },
    }),
    db.product.findMany({ where: { active: true, stock: { lte: LOW_STOCK_THRESHOLD } }, select: { name: true, nameMarathi: true, stock: true } }),
  ]);

  return {
    today: { orders: kpis.ordersToday, paidOrders: today.paidOrders, revenue: today.revenue, bestSellers: today.bestSellers },
    last7Days: { paidOrders: week.paidOrders, revenue: week.revenue, bestSeller: week.bestSellers[0] ?? null },
    unpaidOrders: unpaid.map((o) => ({ order: displayOrderNumber(o.number), customer: o.customer.name, total: formatUSD(o.totalCents) })),
    packFirst: packQueue.map((o) => ({
      order: displayOrderNumber(o.number),
      country: o.shipCountry,
      status: o.fulfilment,
      items: o.items.map((i) => `${i.product.name} / ${i.product.nameMarathi} x${i.quantity}`).join(", "),
    })),
    lowStock: lowStock.map((p) => ({ product: p.name, nameMarathi: p.nameMarathi, packsLeft: p.stock })),
    toPackCount: kpis.toPack,
  };
}

/** Changes whenever any order changes, so cached summaries refresh after a new order. */
export async function ordersVersion(): Promise<string> {
  const latest = await db.order.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } });
  const productTouch = await db.product.aggregate({ _sum: { stock: true } });
  return `${latest?.updatedAt.toISOString() ?? "none"}|${productTouch._sum.stock ?? 0}`;
}
