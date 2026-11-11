"use client";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { CartProvider } from "@/components/shop/CartProvider";
import { CounterChatProvider } from "@/components/counter/CounterChatProvider";

const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // deferLoading: the PayPal SDK script only loads when a payment block mounts (keeps first paint fast).
    <PayPalScriptProvider deferLoading options={{ clientId: paypalClientId, currency: "USD", intent: "capture", components: "buttons" }}>
      <CartProvider>
        <CounterChatProvider>{children}</CounterChatProvider>
      </CartProvider>
    </PayPalScriptProvider>
  );
}
