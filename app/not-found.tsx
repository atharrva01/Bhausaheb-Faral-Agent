import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-6xl" aria-hidden>🪔</p>
      <h1 className="mt-4 font-display text-4xl text-maroon">Page not found</h1>
      <p className="mt-2 max-w-sm text-muted">This page seems to have gone the way of the last chakli on the plate.</p>
      <Link href="/" className="mt-6 rounded-full bg-maroon px-6 py-2.5 font-semibold text-cream hover:bg-maroon-dark">
        Back to the faral
      </Link>
    </main>
  );
}
