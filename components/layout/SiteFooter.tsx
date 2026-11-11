import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t-2 border-ink pb-28 pt-6 text-[15px] text-pencil lg:pb-8">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 sm:px-6 md:flex-row md:justify-between">
        <div className="space-y-0.5">
          <p>Bhausaheb General Kirana Stores, opposite the bus depot, Karjat, Raigad, Maharashtra.</p>
          <p>Rates in US dollars. Payments through PayPal (sandbox for this demo).</p>
        </div>
        <nav aria-label="Footer" className="flex gap-5">
          <Link href="/about" className="underline-offset-4 hover:underline">Our story</Link>
          <Link href="/owner" className="underline-offset-4 hover:underline">Shop side</Link>
        </nav>
      </div>
    </footer>
  );
}
