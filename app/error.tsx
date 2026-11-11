"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="font-display text-4xl text-maroon">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-muted">Sorry about that. Please try again. If you were paying, you have not been charged twice.</p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className="rounded-full bg-maroon px-6 py-2.5 font-semibold text-cream hover:bg-maroon-dark">
          Try again
        </button>
        <Link href="/" className="rounded-full border border-line px-6 py-2.5 font-semibold hover:bg-cream-deep">
          Go to the shop
        </Link>
      </div>
    </main>
  );
}
