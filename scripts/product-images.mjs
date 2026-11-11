// Lists real product photos (public/products/{slug}.jpg) into lib/product-images.json.
// Runs before dev/build, so dropping a photo in and redeploying swaps it in with no code change.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const slugs = readdirSync("public/products")
  .filter((f) => f.endsWith(".jpg"))
  .map((f) => f.slice(0, -4))
  .sort();
const out = JSON.stringify({ jpg: slugs }, null, 2) + "\n";
const path = "lib/product-images.json";
let current = "";
try {
  current = readFileSync(path, "utf8");
} catch {}
if (current !== out) writeFileSync(path, out);
console.log(`[product-images] photos: ${slugs.length ? slugs.join(", ") : "none (using illustrations)"}`);
