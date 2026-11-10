import Image from "next/image";
import { formatUSD } from "@/lib/money";

export type ProductCardData = {
  id: string;
  name: string;
  nameMarathi: string;
  description: string;
  packSize: string;
  priceCents: number;
  stock: number;
  imageUrl: string;
  spiceLevel: string | null;
};

const spiceLabel: Record<string, string> = { mild: "Mild", medium: "Medium spice", spicy: "Spicy 🌶" };

export function ProductCard({ product }: { product: ProductCardData }) {
  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= 5;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white/70 shadow-sm transition hover:shadow-md">
      <div className="relative aspect-[4/3] bg-cream-deep">
        <Image
          src={product.imageUrl}
          alt={`${product.name} (${product.nameMarathi})`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className={`object-cover ${soldOut ? "opacity-50 grayscale" : ""}`}
        />
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            soldOut ? "bg-ink/80 text-white" : lowStock ? "bg-saffron text-white" : "bg-leaf text-white"
          }`}
        >
          {soldOut ? "Sold out" : lowStock ? `Only ${product.stock} left` : "In stock"}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold leading-tight">
            {product.name}
            <span lang="mr" className="ml-2 text-sm font-normal text-muted">
              {product.nameMarathi}
            </span>
          </h3>
          <span className="shrink-0 text-lg font-bold text-maroon">{formatUSD(product.priceCents)}</span>
        </div>
        <p className="text-sm leading-snug text-muted">{product.description}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-1 text-xs text-muted">
          <span className="rounded-md bg-cream-deep px-2 py-0.5">{product.packSize}</span>
          {product.spiceLevel && (
            <span className="rounded-md bg-cream-deep px-2 py-0.5">{spiceLabel[product.spiceLevel] ?? product.spiceLevel}</span>
          )}
          <span className="rounded-md bg-cream-deep px-2 py-0.5">Veg · Eggless</span>
        </div>
      </div>
    </article>
  );
}
