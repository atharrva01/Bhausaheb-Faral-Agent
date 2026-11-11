"use client";

import dynamic from "next/dynamic";

// Client-only: the form restores saved details from localStorage on first render (no hydration mismatch).
const CheckoutView = dynamic(() => import("@/components/checkout/CheckoutView"), {
  ssr: false,
  loading: () => <p className="mx-auto max-w-[1280px] px-4 py-16 text-pencil">Reading your bill…</p>,
});

export function CheckoutClient() {
  return <CheckoutView />;
}
