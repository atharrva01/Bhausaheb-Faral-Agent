import { db } from "@/lib/db";
import { SHIPPING_RATES, SUPPORTED_COUNTRIES, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/shipping";
import { formatUSD } from "@/lib/money";
import { ProductCard } from "@/components/shop/ProductCard";

// Stock changes with every order, so always render at request time.
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const products = await db.product.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true, name: true, nameMarathi: true, description: true, packSize: true,
      priceCents: true, stock: true, imageUrl: true, spiceLevel: true,
    },
  });

  return (
    <main className="flex-1">
      <header className="relative overflow-hidden bg-maroon text-cream">
        <Diya className="pointer-events-none absolute -right-6 -top-4 h-40 w-40 opacity-20 sm:h-56 sm:w-56" />
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-turmeric">Gharguti Diwali faral</p>
          <h1 className="mt-2 font-display text-4xl leading-tight sm:text-6xl">
            Bhausaheb Faral <span lang="mr" className="text-turmeric">भाऊसाहेब फराळ</span>
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-cream/90 sm:text-xl">
            Homemade Diwali faral from Karjat, delivered to your doorstep abroad.
          </p>
          <p className="mt-4 text-sm text-cream/80">
            Made in Karjat, Maharashtra. Ships to{" "}
            {SUPPORTED_COUNTRIES.map((c) => `${SHIPPING_RATES[c].flag} ${SHIPPING_RATES[c].name}`).join(", ")}.
          </p>
          <p className="mt-1 text-sm text-cream/80">
            Free shipping on orders over {formatUSD(FREE_SHIPPING_THRESHOLD_CENTS)}. Pay securely in USD with PayPal.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="font-display text-3xl text-maroon">This Diwali&apos;s faral</h2>
        <p className="mt-1 text-muted">Made fresh in small batches by Aai. Prices are per pack.</p>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <footer className="border-t border-line py-6 text-center text-sm text-muted">
        Bhausaheb General Kirana Stores · Opposite Bus Depot, Karjat, Raigad, Maharashtra
      </footer>
    </main>
  );
}

function Diya({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path d="M50 8 C58 22 60 32 50 42 C40 32 42 22 50 8 Z" fill="#f2b632" />
      <path d="M50 18 C54 26 55 32 50 38 C45 32 46 26 50 18 Z" fill="#e8772e" />
      <path d="M12 52 Q50 50 88 52 Q80 82 50 84 Q20 82 12 52 Z" fill="#e8772e" />
      <path d="M12 52 Q50 62 88 52" fill="none" stroke="#fdf6e9" strokeWidth="3" />
    </svg>
  );
}
