import type { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export const metadata: Metadata = { title: "Checkout · Bhausaheb Faral" };

export default function CheckoutPage() {
  return (
    <main className="flex-1">
      <CheckoutClient />
    </main>
  );
}
