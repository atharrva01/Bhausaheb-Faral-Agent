import { z } from "zod";
import { requireOwner } from "@/lib/owner-session";
import { listOrderRows, setFulfilment } from "@/lib/owner/orders";
import { getKpis } from "@/lib/owner/stats";

export async function GET() {
  const denied = await requireOwner();
  if (denied) return denied;
  const [rows, kpis] = await Promise.all([listOrderRows(), getKpis()]);
  return Response.json({ rows, kpis });
}

const patchSchema = z.object({
  id: z.string().min(1),
  fulfilment: z.enum(["NEW", "PACKING", "SHIPPED", "DELIVERED"]),
});

// Inline status edit from the AG Grid dropdown.
export async function PATCH(req: Request) {
  const denied = await requireOwner();
  if (denied) return denied;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "VALIDATION", message: "Invalid status update" }, { status: 400 });
  try {
    await setFulfilment(parsed.data.id, parsed.data.fulfilment, { actor: "dashboard" });
  } catch (err) {
    return Response.json({ error: "REJECTED", message: err instanceof Error ? err.message : "Update failed" }, { status: 400 });
  }
  const [rows, kpis] = await Promise.all([listOrderRows(), getKpis()]);
  return Response.json({ row: rows.find((r) => r.id === parsed.data.id), kpis });
}
