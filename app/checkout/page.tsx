import type { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { Suspense } from "react";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = { title: "Your bill · Bhausaheb Faral" };

export default function CheckoutPage() {
  return (
    <>
      <Suspense>
        <SiteHeader />
      </Suspense>
      <main className="flex-1">
        <CheckoutClient />
      </main>
      <SiteFooter />
    </>
  );
}
