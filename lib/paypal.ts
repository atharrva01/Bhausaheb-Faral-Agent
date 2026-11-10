// PayPal REST client (Orders v2 + refunds). Sandbox only. Server-side only.
import "server-only";
import { toPayPalValue } from "@/lib/money";

const API_BASE = process.env.PAYPAL_API_BASE ?? "https://api-m.sandbox.paypal.com";

if (API_BASE.includes("api-m.paypal.com") && !API_BASE.includes("sandbox")) {
  throw new Error("Live PayPal API base detected. This app is sandbox-only.");
}

export class PayPalError extends Error {
  constructor(
    message: string,
    public status: number,
    public issue: string | undefined,
    public details: unknown,
  ) {
    super(message);
    this.name = "PayPalError";
  }
}

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;

  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET not set");

  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new PayPalError("PayPal auth failed", res.status, undefined, await res.text());
  const json = (await res.json()) as { access_token: string; expires_in: number };
  // Refresh a minute early.
  cachedToken = { value: json.access_token, expiresAt: Date.now() + (json.expires_in - 60) * 1000 };
  return json.access_token;
}

async function paypalFetch<T>(path: string, init: { method: string; body?: unknown; requestId?: string }): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.requestId ? { "PayPal-Request-Id": init.requestId } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const issue = json?.details?.[0]?.issue ?? json?.name;
    throw new PayPalError(json?.message ?? `PayPal ${init.method} ${path} failed`, res.status, issue, json);
  }
  return json as T;
}

// ---------- Types (only the fields we use) ----------

type Money = { currency_code: string; value: string };

export type PayPalOrder = {
  id: string;
  status: "CREATED" | "SAVED" | "APPROVED" | "VOIDED" | "COMPLETED" | "PAYER_ACTION_REQUIRED";
  purchase_units: {
    reference_id?: string;
    custom_id?: string;
    amount: Money;
    payments?: {
      captures?: { id: string; status: string; amount: Money }[];
      refunds?: { id: string; status: string; amount: Money }[];
    };
  }[];
  payer?: { email_address?: string; name?: { given_name?: string; surname?: string } };
};

export type CreateOrderInput = {
  orderId: string; // our DB id
  orderNumberLabel: string; // "#1021"
  items: { name: string; sku: string; quantity: number; unitCents: number }[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  shipping: {
    fullName: string;
    line1: string;
    line2?: string | null;
    city: string;
    state?: string | null;
    postalCode?: string | null;
    countryCode: string;
  };
};

// ---------- API ----------

export async function createOrder(input: CreateOrderInput): Promise<PayPalOrder> {
  // PayPal rejects the order unless item_total + shipping == total exactly.
  const itemTotal = input.items.reduce((s, i) => s + i.unitCents * i.quantity, 0);
  if (itemTotal !== input.subtotalCents || input.subtotalCents + input.shippingCents !== input.totalCents) {
    throw new Error("PayPal amount breakdown does not add up");
  }
  const usd = (cents: number) => ({ currency_code: "USD", value: toPayPalValue(cents) });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return paypalFetch<PayPalOrder>("/v2/checkout/orders", {
    method: "POST",
    requestId: `create-${input.orderId}`,
    body: {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.orderId,
          custom_id: input.orderId,
          // invoice_id must be unique forever per merchant; DB numbers restart on re-seed, ids don't.
          invoice_id: `BF-${input.orderId}`,
          description: `Bhausaheb Faral order ${input.orderNumberLabel}`,
          amount: {
            ...usd(input.totalCents),
            breakdown: { item_total: usd(input.subtotalCents), shipping: usd(input.shippingCents) },
          },
          items: input.items.map((i) => ({
            name: i.name.slice(0, 127),
            sku: i.sku,
            quantity: String(i.quantity),
            unit_amount: usd(i.unitCents),
            category: "PHYSICAL_GOODS",
          })),
          shipping: {
            type: "SHIPPING",
            name: { full_name: input.shipping.fullName },
            address: {
              address_line_1: input.shipping.line1,
              ...(input.shipping.line2 ? { address_line_2: input.shipping.line2 } : {}),
              admin_area_2: input.shipping.city,
              ...(input.shipping.state ? { admin_area_1: input.shipping.state } : {}),
              ...(input.shipping.postalCode ? { postal_code: input.shipping.postalCode } : {}),
              country_code: input.shipping.countryCode,
            },
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "Bhausaheb Faral",
            // Buyer cannot change the address the agent/form collected.
            shipping_preference: "SET_PROVIDED_ADDRESS",
            user_action: "PAY_NOW",
            return_url: `${appUrl}/order/${input.orderId}`,
            cancel_url: `${appUrl}/`,
          },
        },
      },
    },
  });
}

export async function getOrder(paypalOrderId: string): Promise<PayPalOrder> {
  return paypalFetch<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`, { method: "GET" });
}

export async function captureOrder(paypalOrderId: string, requestId: string): Promise<PayPalOrder> {
  return paypalFetch<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
    method: "POST",
    requestId,
    body: {},
  });
}

export async function refundCapture(captureId: string, requestId: string, amountCents?: number, note?: string) {
  return paypalFetch<{ id: string; status: string }>(`/v2/payments/captures/${encodeURIComponent(captureId)}/refund`, {
    method: "POST",
    requestId,
    body: {
      ...(amountCents !== undefined ? { amount: { currency_code: "USD", value: toPayPalValue(amountCents) } } : {}),
      ...(note ? { note_to_payer: note.slice(0, 255) } : {}),
    },
  });
}

/** First capture on an order, if any. */
export function firstCapture(order: PayPalOrder) {
  return order.purchase_units[0]?.payments?.captures?.[0];
}
