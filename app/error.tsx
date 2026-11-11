"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-[560px] flex-1 px-4 py-16">
      <h1 className="type-title text-[30px] sm:text-[40px]">Something at the counter broke</h1>
      <p className="mt-3 text-lg">
        Your bill is safe and nothing was charged twice. Try the page again; if it keeps happening, go back to today&apos;s rates.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={reset} className="h-12 rounded-[4px] border-[1.5px] border-ink bg-ink px-5 font-semibold text-paper">
          Try the page again
        </button>
        <Link href="/" className="inline-flex h-12 items-center rounded-[4px] border-[1.5px] border-ink px-5 font-semibold hover:bg-paper">
          Back to today&apos;s rates
        </Link>
      </div>
    </main>
  );
}
