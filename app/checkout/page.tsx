import type { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { Signboard } from "@/components/brand/Signboard";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = { title: "Your bill · Bhausaheb Faral" };

export default function CheckoutPage() {
  return (
    <>
      <Signboard slim />
      <main className="flex-1">
        <CheckoutClient />
      </main>
      <SiteFooter />
    </>
  );
}
