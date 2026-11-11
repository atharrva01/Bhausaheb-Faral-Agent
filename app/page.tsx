import { db } from "@/lib/db";
import { Signboard } from "@/components/brand/Signboard";
import { RateBoard } from "@/components/shop/RateBoard";
import { Counter } from "@/components/counter/Counter";
import { BillBar } from "@/components/shop/BillBar";
import { SiteFooter } from "@/components/layout/SiteFooter";

// Stock changes with every order, so always render at request time.
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const products = await db.product.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true, name: true, nameMarathi: true, description: true, packSize: true, priceCents: true, stock: true, spiceLevel: true },
  });

  return (
    <>
      <Signboard />
      {/* One counter in the DOM: inline after the intro on phones, a sticky full-height column on desktop. */}
      <main className="mx-auto grid w-full max-w-[1280px] flex-1 grid-cols-1 gap-x-10 px-4 sm:px-6 lg:grid-cols-12">
        <div className="min-w-0 pt-7 lg:col-span-7 lg:row-start-1 lg:pt-9">
          <h1 className="type-title text-[30px] leading-[1.1] sm:text-[40px]">Aai&apos;s Diwali faral, 2026 batch</h1>
          <p className="mt-3 max-w-[34em] text-lg leading-relaxed">
            Fried, rolled and packed by hand in Karjat, then posted to you in the US, UK, Canada, UAE and Australia. Tell the counter what
            you want, or add packets from the rate board.
          </p>
        </div>

        <aside className="mt-7 min-w-0 lg:sticky lg:top-3 lg:col-span-5 lg:col-start-8 lg:row-span-3 lg:row-start-1 lg:mt-0 lg:self-start">
          <div className="flex max-h-[min(78svh,640px)] flex-col lg:h-[calc(100svh-9.5rem)] lg:max-h-[760px] lg:pt-7">
            <Counter withBill className="min-h-0 flex-1" />
          </div>
        </aside>

        <div className="min-w-0 pb-10 lg:col-span-7 lg:row-start-2">
          <div className="mt-9">
            <RateBoard rows={products} />
          </div>

          <section aria-labelledby="parcel-heading" className="mt-10 max-w-[38em]">
            <h2 id="parcel-heading" className="type-head border-b-2 border-ink pb-2 text-2xl">
              How the parcel reaches you
            </h2>
            <p className="mt-3 leading-relaxed">
              Aai fries and packs your faral after your payment comes in, in airtight dabbas stitched into a cloth parcel. We post it by India
              Post speed post and email you the tracking number the same day. Ladoos and karanji keep for about two weeks, chakli and chivda for a
              month.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
      <BillBar />
    </>
  );
}
