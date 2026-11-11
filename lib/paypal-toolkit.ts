// PayPal Agent Toolkit (owner side). Per PRD 5.3 rev 2 the model never receives these tool objects:
// read tools are wrapped in our own AI SDK v7 tools, write tools are only called by confirmed-action executors
// with server-built arguments. The toolkit bundles AI SDK v4, so we call each tool's `execute()` directly.
import "server-only";
import { PayPalAgentToolkit } from "@paypal/agent-toolkit/ai-sdk";

let toolkit: PayPalAgentToolkit | null = null;

function getToolkit() {
  if (!toolkit) {
    toolkit = new PayPalAgentToolkit({
      clientId: process.env.PAYPAL_CLIENT_ID!,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
      configuration: {
        actions: {
          invoices: { create: true, list: true, get: true, send: true, sendReminder: true },
          orders: { get: true },
          shipment: { create: true, show: true },
        },
        context: { sandbox: true },
      },
    });
    if (process.env.NODE_ENV !== "production") {
      console.log("[paypal-toolkit] tools:", Object.keys(toolkit.getTools()).join(", "));
    }
  }
  return toolkit;
}

export class ToolkitError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ToolkitError";
  }
}

/** Run a toolkit tool by name. Normalises the toolkit's `{ ok:false, ... }` error objects into exceptions. */
export async function runToolkit<T = Record<string, unknown>>(name: string, args: Record<string, unknown>): Promise<T> {
  const tool = getToolkit().getTools()[name];
  if (!tool?.execute) throw new ToolkitError(`PayPal toolkit tool "${name}" is not available`);
  const raw = await tool.execute(args, { toolCallId: `server-${name}-${Date.now()}`, messages: [] });
  const result = typeof raw === "string" ? safeJson(raw) : raw;
  if (result && typeof result === "object" && (result as { ok?: boolean }).ok === false) {
    const r = result as { status?: number; message?: string };
    const msg =
      r.status === 403
        ? "PayPal refused: this app doesn't have permission for that feature (enable it in the PayPal developer dashboard)."
        : (r.message ?? "PayPal request failed");
    throw new ToolkitError(msg, r.status);
  }
  return result as T;
}

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return { text: s };
  }
}

/** Pull an id out of the various PayPal response shapes (object id, or a link href). */
export function extractId(r: unknown): string | null {
  if (!r || typeof r !== "object") return null;
  const o = r as { id?: string; href?: string; links?: { rel: string; href: string }[] };
  if (o.id) return o.id;
  const href = o.href ?? o.links?.find((l) => l.rel === "self")?.href;
  return href ? (href.split("/").pop() ?? null) : null;
}
