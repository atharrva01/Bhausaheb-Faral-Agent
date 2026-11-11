import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-cream-deep/60 pb-28 pt-8 text-sm text-muted sm:pb-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-display text-lg text-maroon">Bhausaheb Faral</p>
          <p>Bhausaheb General Kirana Stores · Opposite Bus Depot, Karjat, Raigad, Maharashtra</p>
          <p className="mt-1">Payments by PayPal (sandbox demo). Prices in USD.</p>
        </div>
        <nav className="flex gap-4" aria-label="Footer">
          <Link href="/about" className="hover:text-maroon">Our story</Link>
          <Link href="/checkout" className="hover:text-maroon">Cart</Link>
          <Link href="/owner" className="hover:text-maroon">Owner login</Link>
        </nav>
      </div>
    </footer>
  );
}
