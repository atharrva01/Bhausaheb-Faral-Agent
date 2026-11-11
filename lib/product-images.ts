import manifest from "@/lib/product-images.json";

const photos = new Set<string>(manifest.jpg);

/** Real photo if public/products/{slug}.jpg exists at build time, else the steel-taat illustration. */
export function productImage(slug: string): string {
  return photos.has(slug) ? `/products/${slug}.jpg` : `/products/${slug}.svg`;
}
