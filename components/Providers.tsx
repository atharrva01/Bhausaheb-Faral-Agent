"use client";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { CartProvider } from "@/components/shop/CartProvider";

const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // deferLoading: the PayPal SDK script only loads when a checkout card mounts (keeps the shop page fast).
    <PayPalScriptProvider
      deferLoading
      options={{ clientId: paypalClientId, currency: "USD", intent: "capture", components: "buttons" }}
    >
      <CartProvider>{children}</CartProvider>
    </PayPalScriptProvider>
  );
}
