import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-brand pb-24 pt-8 text-[15px] text-white/85 sm:pb-8">
      <div className="mx-auto grid max-w-[1320px] gap-6 px-4 sm:grid-cols-3 sm:px-6">
        <div>
          <p lang="mr" className="type-sign text-xl text-cta">भाऊसाहेब फराळ</p>
          <p className="mt-1">Bhausaheb General Kirana Stores, opposite the bus depot, Karjat, Raigad, Maharashtra.</p>
        </div>
        <div>
          <p className="font-semibold text-white">Ordering</p>
          <ul className="mt-1 space-y-1">
            <li>Prices in US dollars, postage added at checkout.</li>
            <li>Payments through PayPal (sandbox for this demo).</li>
          </ul>
        </div>
        <nav aria-label="Footer">
          <p className="font-semibold text-white">Shop</p>
          <ul className="mt-1 space-y-1">
            <li><Link href="/about" className="hover:text-white hover:underline">Our story</Link></li>
            <li><Link href="/checkout" className="hover:text-white hover:underline">Your cart</Link></li>
            <li><Link href="/owner" className="hover:text-white hover:underline">Shop side login</Link></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
