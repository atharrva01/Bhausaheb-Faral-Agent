"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PayPalButtons, usePayPalScriptReducer, DISPATCH_ACTION, SCRIPT_LOADING_STATE } from "@paypal/react-paypal-js";
import { formatUSD } from "@/lib/money";

type Props = {
  orderId: string; // our DB id
  orderNumber: string;
  paypalOrderId: string; // created server-side with server-computed amounts
  totalCents: number;
  onPaid?: () => void;
};

/**
 * PayPal Smart Buttons for an order the SERVER already created. The client never sends an amount.
 * Reused by the cart drawer (M2) and the chat agent's checkout card (M3).
 */
export function PayPalCheckout({ orderId, orderNumber, paypalOrderId, totalCents, onPaid }: Props) {
  const router = useRouter();
  const [{ isPending, isRejected }, dispatch] = usePayPalScriptReducer();
  const [status, setStatus] = useState<"idle" | "capturing" | "paid">("idle");
  const [error, setError] = useState<string | null>(null);

  // Load the SDK script on first checkout (provider uses deferLoading).
  useEffect(() => {
    dispatch({ type: DISPATCH_ACTION.LOADING_STATUS, value: SCRIPT_LOADING_STATE.PENDING });
  }, [dispatch]);

  if (status === "paid") {
    return (
      <div className="rounded-xl border border-leaf/40 bg-leaf/10 p-4 text-sm">
        <p className="font-semibold text-leaf">Payment received for order {orderNumber}. Dhanyavaad! 🪔</p>
        <p className="mt-1 text-muted">Opening your order page…</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="mb-3 flex items-baseline justify-between text-sm">
        <span className="text-muted">Order {orderNumber}</span>
        <span className="text-base font-bold text-maroon">Pay {formatUSD(totalCents)}</span>
      </div>

      {isPending && <p className="py-4 text-center text-sm text-muted">Loading PayPal…</p>}
      {isRejected && <p className="py-4 text-center text-sm text-red-700">PayPal could not load. Please refresh the page.</p>}

      {status === "capturing" ? (
        <p className="py-4 text-center text-sm text-muted">Confirming your payment…</p>
      ) : (
        <PayPalButtons
          style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
          fundingSource={undefined}
          forceReRender={[paypalOrderId]}
          createOrder={async () => paypalOrderId}
          onApprove={async (_data, actions) => {
            setStatus("capturing");
            setError(null);
            const res = await fetch("/api/paypal/capture", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId }),
            });
            const json = await res.json();
            if (res.ok) {
              setStatus("paid");
              onPaid?.();
              router.push(`/order/${orderId}`);
              return;
            }
            setStatus("idle");
            if (json.error === "DECLINED") {
              setError(json.message);
              return actions.restart();
            }
            setError(json.message ?? "Payment failed. You have not been charged.");
          }}
          onCancel={() => setError("Payment cancelled. Your cart is saved; you can pay any time.")}
          onError={(err) => {
            console.error("PayPal button error", err);
            setError("PayPal ran into a problem. Please try again.");
          }}
        />
      )}

      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <p className="mt-2 text-center text-xs text-muted">Sandbox demo: use a PayPal sandbox buyer account.</p>
    </div>
  );
}
