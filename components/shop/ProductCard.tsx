import Image from "next/image";
import { formatUSD } from "@/lib/money";
import { QuantityControl } from "@/components/shop/QuantityControl";

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

const spiceLabel: Record<string, string> = { mild: "Mild", medium: "Medium spice", spicy: "Spicy" };

export function ProductCard({ product }: { product: ProductCardData }) {
  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= 5;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <div className="relative aspect-[4/3] bg-cream-deep">
        <Image
          src={product.imageUrl}
          alt={`${product.name} (${product.nameMarathi})`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover ${soldOut ? "opacity-50 grayscale" : ""}`}
        />
        {(soldOut || lowStock) && (
          <span
            className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white ${soldOut ? "bg-ink/80" : "bg-saffron"}`}
          >
            {soldOut ? "Sold out" : `Only ${product.stock} left`}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
        <div>
          <h3 className="font-semibold leading-tight sm:text-lg">{product.name}</h3>
          <p lang="mr" className="text-sm text-muted">
            {product.nameMarathi}
          </p>
        </div>
        <p className="line-clamp-2 text-xs leading-snug text-muted sm:text-sm">{product.description}</p>
        <p className="text-xs text-muted">
          {product.packSize}
          {product.spiceLevel ? ` · ${spiceLabel[product.spiceLevel] ?? product.spiceLevel}` : ""}
          <span className="hidden sm:inline"> · Veg, eggless</span>
        </p>
        <div className="mt-auto flex flex-col gap-2 pt-1">
          <span className="text-lg font-bold text-maroon">{formatUSD(product.priceCents)}</span>
          <QuantityControl productId={product.id} stock={product.stock} compact />
        </div>
      </div>
    </article>
  );
}
