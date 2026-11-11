import { Suspense } from "react";
import { db } from "@/lib/db";
import { salesStats } from "@/lib/owner/stats";
import { categoryOf, parseCategory, CATEGORIES } from "@/lib/catalog";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { DiwaliBanner } from "@/components/home/DiwaliBanner";
import { TrustStrip } from "@/components/home/TrustStrip";
import { ProductCard } from "@/components/shop/ProductCard";
import { BillBar } from "@/components/shop/BillBar";
import { SiteFooter } from "@/components/layout/SiteFooter";

// Stock changes with every order, so always render at request time.
export const dynamic = "force-dynamic";

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ q?: string; c?: string }> }) {
  const { q: rawQ, c } = await searchParams;
  const q = (rawQ ?? "").trim().toLowerCase();
  const cat = parseCategory(c);

  const [products, week] = await Promise.all([
    db.product.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, slug: true, name: true, nameMarathi: true, description: true, packSize: true, priceCents: true, stock: true, spiceLevel: true },
    }),
    salesStats(7),
  ]);

  // "Bestseller this week" comes from real paid orders, never made up.
  const best = new Set(week.bestSellers.slice(0, 2).map((b) => b.name));
  const shown = products.filter(
    (p) =>
      (cat === "all" || categoryOf(p.slug) === cat) &&
      (!q || `${p.name} ${p.nameMarathi} ${p.description} ${p.slug}`.toLowerCase().includes(q)),
  );
  const catLabel = CATEGORIES.find((x) => x.id === cat)!.label;

  return (
    <>
      <Suspense>
        <SiteHeader withCategories />
      </Suspense>
      <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 pb-10 pt-5 sm:px-6">
        <div className="space-y-8">
          {!q && cat === "all" && <DiwaliBanner />}

          <section id="faral" aria-labelledby="faral-heading" className="scroll-mt-32">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="faral-heading" className="type-head text-[26px]">
                {q ? `Results for “${rawQ?.trim()}”` : cat === "all" ? "Diwali faral" : `${catLabel} faral`}
              </h2>
              <p className="text-[15px] text-muted">
                {shown.length} item{shown.length === 1 ? "" : "s"}, priced per packet
              </p>
            </div>
            {shown.length === 0 ? (
              <p className="mt-4 rounded-[12px] border border-line bg-card p-6 text-muted">
                Nothing matches that. Try &ldquo;chakli&rdquo; or &ldquo;ladoo&rdquo;, or tap Ask Aai and describe what you want.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {shown.map((p) => (
                  <ProductCard key={p.id} p={p} bestseller={best.has(p.name)} />
                ))}
              </div>
            )}
          </section>

          <TrustStrip />
        </div>
      </main>
      <SiteFooter />
      <BillBar />
    </>
  );
}
