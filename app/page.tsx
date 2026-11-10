import { db } from "@/lib/db";
import { SHIPPING_RATES, SUPPORTED_COUNTRIES, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/shipping";
import { formatUSD } from "@/lib/money";
import { ProductCard } from "@/components/shop/ProductCard";
import { OpenChatButton } from "@/components/chat/OpenChatButton";

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
        <Diya className="pointer-events-none absolute -right-8 -top-2 h-32 w-32 opacity-20 sm:h-56 sm:w-56" />
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-turmeric sm:text-sm">Gharguti Diwali faral</p>
          <h1 className="mt-2 font-display text-3xl leading-tight sm:text-6xl">
            Bhausaheb Faral{" "}
            <span lang="mr" className="block text-turmeric sm:inline">
              भाऊसाहेब फराळ
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-base text-cream/90 sm:text-xl">
            Homemade Diwali faral from Karjat, delivered to your doorstep abroad.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2 text-xs sm:text-sm">
            {SUPPORTED_COUNTRIES.map((c) => (
              <li key={c} className="rounded-full bg-cream/15 px-2.5 py-1">
                {SHIPPING_RATES[c].short}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <OpenChatButton className="rounded-full bg-turmeric px-5 py-2.5 font-semibold text-ink shadow hover:brightness-105">
              Order by chatting with Aai&apos;s assistant
            </OpenChatButton>
            <a href="#faral" className="rounded-full border border-cream/40 px-5 py-2.5 font-semibold hover:bg-cream/10">
              Browse faral
            </a>
          </div>
          <p className="mt-4 text-sm text-cream/80">
            Free shipping over {formatUSD(FREE_SHIPPING_THRESHOLD_CENTS)} · Pay in USD with PayPal
          </p>
        </div>
      </header>

      <section id="faral" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-8 pb-28 sm:py-10">
        <h2 className="font-display text-2xl text-maroon sm:text-3xl">This Diwali&apos;s faral</h2>
        <p className="mt-1 text-muted">Made fresh in small batches by Aai. Prices are per pack.</p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
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
