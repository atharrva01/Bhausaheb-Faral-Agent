import type { Metadata } from "next";
import { listOrderRows } from "@/lib/owner/orders";
import { getKpis } from "@/lib/owner/stats";
import { OwnerDashboard } from "@/components/owner/OwnerDashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Owner dashboard · Bhausaheb Faral" };

// Auth: proxy.ts redirects to /owner/login when there is no valid owner session.
export default async function OwnerPage() {
  const [rows, kpis] = await Promise.all([listOrderRows(), getKpis()]);
  return <OwnerDashboard initialRows={rows} initialKpis={kpis} />;
}
