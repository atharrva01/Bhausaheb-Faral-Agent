"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-[560px] flex-1 px-4 py-16">
      <h1 className="type-title text-[30px] sm:text-[40px]">Something at the counter broke</h1>
      <p className="mt-3 text-lg text-muted">
        Your bill is safe and nothing was charged twice. Try the page again; if it keeps happening, go back to today&apos;s rates.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={reset} className="h-12 rounded-[6px] bg-cta px-5 font-semibold text-ink">
          Try the page again
        </button>
        <Link href="/" className="inline-flex h-12 items-center rounded-[6px] border border-line px-5 font-semibold hover:border-accent">
          Back to the shop
        </Link>
      </div>
    </main>
  );
}
