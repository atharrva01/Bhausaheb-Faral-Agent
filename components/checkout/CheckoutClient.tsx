"use client";

import dynamic from "next/dynamic";

// Client-only: the form restores saved details from localStorage on first render (no hydration mismatch).
const CheckoutView = dynamic(() => import("@/components/checkout/CheckoutView"), {
  ssr: false,
  loading: () => <p className="py-20 text-center text-muted">Loading your cart…</p>,
});

export function CheckoutClient() {
  return <CheckoutView />;
}
