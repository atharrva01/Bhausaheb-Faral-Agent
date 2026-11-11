import Image from "next/image";
import { formatUSD } from "@/lib/money";
import { productImage } from "@/lib/product-images";
import { QuantityControl } from "@/components/shop/QuantityControl";

export type RateRow = {
  id: string;
  slug: string;
  name: string;
  nameMarathi: string;
  description: string;
  packSize: string;
  priceCents: number;
  stock: number;
  spiceLevel: string | null;
};

const SPICE: Record<string, string> = { mild: "mild", medium: "medium spicy", spicy: "spicy" };

/** Today's rates, laid out like the rate board by the counter (rows and column heads, no cards). */
export function RateBoard({ rows }: { rows: RateRow[] }) {
  return (
    <section aria-labelledby="rates-heading">
      <div className="flex items-end justify-between gap-4 border-b-2 border-ink pb-2">
        <h2 id="rates-heading" className="type-head text-2xl">
          Today&apos;s rates
        </h2>
        <p className="hidden text-[15px] text-pencil sm:block">Per packet, in US dollars. Postage goes on the bill.</p>
      </div>

      {/* Column heads (desktop) */}
      <div className="hidden grid-cols-[88px_1fr_84px_76px_148px] gap-4 border-b border-rule py-1.5 text-sm text-pencil md:grid" aria-hidden="true">
        <span />
        <span lang="mr" className="mr">माल</span>
        <span lang="mr" className="mr">पुडा</span>
        <span lang="mr" className="mr text-right">भाव</span>
        <span />
      </div>

      <ul>
        {rows.map((p) => {
          const out = p.stock <= 0;
          return (
            <li
              key={p.id}
              className="grid grid-cols-[72px_1fr] gap-x-4 gap-y-2 border-b border-rule py-4 md:grid-cols-[88px_1fr_84px_76px_148px] md:items-center"
            >
              <div className={`relative row-span-2 h-[72px] w-[72px] md:row-span-1 md:h-[88px] md:w-[88px] ${out ? "opacity-55 grayscale" : ""}`}>
                <Image src={productImage(p.slug)} alt={`${p.name} on a steel plate`} fill sizes="88px" className="object-contain" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold leading-tight">
                  {p.name}{" "}
                  <span lang="mr" className="mr font-normal text-pencil">
                    {p.nameMarathi}
                  </span>
                </h3>
                <p className="mt-0.5 text-[15px] leading-snug text-pencil">
                  {p.description} {p.spiceLevel ? `Taste: ${SPICE[p.spiceLevel] ?? p.spiceLevel}.` : ""}
                </p>
              </div>
              <div className="col-start-2 flex flex-wrap items-center justify-between gap-3 md:contents">
                <span className="num text-[15px] text-pencil md:text-base md:text-ink">{p.packSize}</span>
                <span className={`num text-lg font-bold md:text-right ${out ? "text-pencil line-through" : ""}`}>{formatUSD(p.priceCents)}</span>
                <span className="md:justify-self-end">
                  <QuantityControl productId={p.id} name={p.name} stock={p.stock} />
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
