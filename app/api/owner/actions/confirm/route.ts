import { z } from "zod";
import { requireOwner } from "@/lib/owner-session";
import { decideAction } from "@/lib/owner/actions";

// Executes (or cancels) a PendingAction by id. Never accepts action arguments from the client:
// the payload was validated and priced on the server when the action was proposed.
export async function POST(req: Request) {
  const denied = await requireOwner();
  if (denied) return denied;
  const parsed = z
    .object({ actionId: z.string().min(1).max(64), decision: z.enum(["confirm", "cancel"]) })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ status: "FAILED", message: "Invalid request" }, { status: 400 });
  return Response.json(await decideAction(parsed.data.actionId, parsed.data.decision));
}
