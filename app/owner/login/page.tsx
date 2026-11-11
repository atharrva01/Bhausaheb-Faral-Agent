import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Owner login · Bhausaheb Faral" };

export default async function OwnerLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-saffron">Bhausaheb Faral</p>
        <h1 className="mt-1 font-display text-3xl text-maroon">Owner dashboard</h1>
        <p className="mb-6 mt-1 text-sm text-muted">Orders, packing list and Aai&apos;s assistant.</p>
        <LoginForm next={next ?? "/owner"} />
      </div>
    </main>
  );
}
