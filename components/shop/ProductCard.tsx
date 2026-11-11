import Image from "next/image";
import { formatUSD } from "@/lib/money";
import { productImage } from "@/lib/product-images";
import { QuantityControl } from "@/components/shop/QuantityControl";

export type ProductCardData = {
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

const TASTE: Record<string, string> = { mild: "Mild", medium: "Medium spicy", spicy: "Spicy" };

export function ProductCard({ p, bestseller }: { p: ProductCardData; bestseller?: boolean }) {
  const out = p.stock <= 0;
  const few = !out && p.stock <= 5;
  return (
    <article className="flex flex-col overflow-hidden rounded-[12px] border border-line bg-card transition-shadow hover:shadow-[0_4px_14px_rgb(28_27_25/0.08)]">
      <div className="relative aspect-[4/3] bg-soft">
        <Image
          src={productImage(p.slug)}
          alt={`${p.name} on a steel plate`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 280px"
          className={`object-contain p-4 ${out ? "opacity-45 grayscale" : ""}`}
        />
        {bestseller && !out && (
          <span className="absolute left-3 top-3 rounded-[4px] bg-cta px-2 py-0.5 text-[13px] font-bold text-ink">Bestseller this week</span>
        )}
        {few && <span className="absolute right-3 top-3 rounded-[4px] bg-danger px-2 py-0.5 text-[13px] font-semibold text-white">Only {p.stock} left</span>}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4 pt-3">
        <h3 className="text-lg font-semibold leading-tight">
          {p.name}{" "}
          <span lang="mr" className="mr font-normal text-muted">
            {p.nameMarathi}
          </span>
        </h3>
        <p className="line-clamp-2 text-[15px] leading-snug text-muted">{p.description}</p>
        <p className="text-[14px] text-muted">
          {p.packSize} packet{p.spiceLevel ? `, ${TASTE[p.spiceLevel]?.toLowerCase() ?? p.spiceLevel}` : ""}
        </p>
        <p className={`num mt-auto pt-1 text-[26px] font-bold leading-none ${out ? "text-muted line-through" : "text-ink"}`}>{formatUSD(p.priceCents)}</p>
        <div className="pt-2">
          <QuantityControl productId={p.id} name={p.name} stock={p.stock} />
        </div>
      </div>
    </article>
  );
}
