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
 * PayPal buttons for a bill the SERVER already wrote. The browser never sends an amount.
 * Sits inside a bill slip (checkout, counter, unpaid order page).
 */
export function PayPalCheckout({ orderId, orderNumber, paypalOrderId, totalCents, onPaid }: Props) {
  const router = useRouter();
  const [{ isPending, isRejected }, dispatch] = usePayPalScriptReducer();
  const [status, setStatus] = useState<"idle" | "capturing" | "paid">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dispatch({ type: DISPATCH_ACTION.LOADING_STATUS, value: SCRIPT_LOADING_STATE.PENDING });
  }, [dispatch]);

  if (status === "paid") {
    return <p className="font-semibold text-stamp" role="status">Paid. Opening bill {orderNumber}…</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-[15px] text-pencil">
        Pay <strong className="num text-ink">{formatUSD(totalCents)}</strong> for bill {orderNumber} with PayPal.
      </p>
      {isPending && <p className="py-3 text-[15px] text-pencil">Opening PayPal…</p>}
      {isRejected && <p className="py-3 text-khata">PayPal didn&apos;t load. Refresh the page; your bill is saved.</p>}
      {status === "capturing" ? (
        <p className="py-3 text-[15px] text-pencil" role="status">PayPal is confirming the payment…</p>
      ) : (
        <PayPalButtons
          style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay", height: 48 }}
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
              setError("PayPal declined that card or account. Pick another way to pay; nothing was charged.");
              return actions.restart();
            }
            setError("PayPal didn't complete the payment, so nothing was charged. Try the PayPal button again.");
          }}
          onCancel={() => setError("You closed PayPal before paying. The bill is saved; pay whenever you're ready.")}
          onError={(err) => {
            console.error("PayPal button error", err);
            setError("PayPal ran into a problem. Try again; nothing was charged.");
          }}
        />
      )}
      {error && <p role="alert" className="text-[15px] text-khata">{error}</p>}
      <p className="text-sm text-pencil">Sandbox demo: use a PayPal sandbox buyer account.</p>
    </div>
  );
}
