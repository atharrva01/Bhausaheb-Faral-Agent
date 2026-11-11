import type { Metadata } from "next";
import { db } from "@/lib/db";
import { listOrderRows } from "@/lib/owner/orders";
import { LOW_STOCK_THRESHOLD, salesStats } from "@/lib/owner/stats";
import { OwnerDashboard } from "@/components/owner/OwnerDashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shop side · Bhausaheb Faral" };

// Auth: proxy.ts redirects to /owner/login when there is no valid owner session.
export default async function OwnerPage() {
  const [rows, week, lowStock] = await Promise.all([
    listOrderRows(),
    salesStats(7),
    db.product.findMany({
      where: { active: true, stock: { lte: LOW_STOCK_THRESHOLD } },
      orderBy: { stock: "asc" },
      select: { name: true, nameMarathi: true, stock: true },
    }),
  ]);
  return <OwnerDashboard initialRows={rows} week={{ revenueCents: week.revenueCents, paidOrders: week.paidOrders }} lowStock={lowStock} />;
}
