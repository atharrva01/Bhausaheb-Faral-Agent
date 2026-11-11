// Presentation-only catalogue groupings for the storefront (tabs, search). No pricing or stock logic here.
export const CATEGORIES = [
  { id: "all", label: "All faral", mr: "सर्व फराळ" },
  { id: "sweet", label: "Sweet", mr: "गोड" },
  { id: "savoury", label: "Savoury", mr: "तिखट" },
] as const;
export type CategoryId = (typeof CATEGORIES)[number]["id"];

const SAVOURY = new Set(["chakli", "chivda", "shev"]);
export const categoryOf = (slug: string): Exclude<CategoryId, "all"> => (SAVOURY.has(slug) ? "savoury" : "sweet");
export const parseCategory = (v: string | undefined): CategoryId => (v === "sweet" || v === "savoury" ? v : "all");
