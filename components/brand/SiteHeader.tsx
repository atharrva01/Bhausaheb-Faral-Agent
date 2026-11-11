"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/components/shop/CartProvider";
import { ChatDrawer } from "@/components/counter/ChatDrawer";
import { AskButton } from "@/components/counter/AskButton";
import { formatUSD } from "@/lib/money";
import { SHIPPING_RATES, SUPPORTED_COUNTRIES } from "@/lib/shipping";
import { CATEGORIES } from "@/lib/catalog";

function CartGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 4h2.2l2.3 10.6a1.8 1.8 0 0 0 1.8 1.4h7.6a1.8 1.8 0 0 0 1.7-1.3L20.6 8H6.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="20" r="1.3" fill="currentColor" />
      <circle cx="17" cy="20" r="1.3" fill="currentColor" />
    </svg>
  );
}

/** Marketplace header: wordmark, deliver-to, search, Ask Aai, cart. Category tabs on the shop front. */
export function SiteHeader({ withCategories = false }: { withCategories?: boolean }) {
  const { cart, setCountry, busy } = useCart();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const cat = params.get("c") ?? "all";
  const count = cart?.itemCount ?? 0;

  return (
    <>
      <header className="sticky top-0 z-40 bg-brand text-white shadow-[0_1px_0_rgb(0_0_0/0.15)]">
        <div className="mx-auto grid max-w-[1320px] grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2.5 px-4 py-2.5 sm:px-6 lg:grid-cols-[auto_auto_1fr_auto]">
          <Link href="/" className="flex min-w-0 flex-col leading-none" aria-label="Bhausaheb Faral, home">
            <span lang="mr" className="type-sign text-[26px] text-cta">भाऊसाहेब फराळ</span>
            <span className="mt-0.5 text-[13px] text-white/85">Homemade in Karjat</span>
          </Link>

          <label className="hidden flex-col rounded-[6px] px-2 py-1 leading-tight hover:bg-brand-deep lg:flex">
            <span className="text-[13px] text-white/80">Deliver to</span>
            <select
              value={cart?.country ?? ""}
              disabled={busy}
              onChange={(e) => setCountry(e.target.value || null)}
              className="cursor-pointer bg-transparent text-[15px] font-semibold text-white [&>option]:text-ink"
              aria-label="Deliver to country"
            >
              <option value="">Choose country</option>
              {SUPPORTED_COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {SHIPPING_RATES[c].name}
                </option>
              ))}
            </select>
          </label>

          <form action="/" role="search" className="order-last col-span-2 flex h-11 overflow-hidden rounded-[8px] bg-white lg:order-none lg:col-span-1">
            {cat !== "all" && <input type="hidden" name="c" value={cat} />}
            <label htmlFor="site-search" className="sr-only">
              Search faral
            </label>
            <input
              id="site-search"
              name="q"
              defaultValue={q}
              key={q}
              placeholder="Search chakli, ladoo, karanji…"
              className="min-w-0 flex-1 bg-transparent px-3.5 text-base text-ink placeholder:text-muted focus-visible:outline-none"
            />
            <button type="submit" className="bg-cta px-4 text-ink hover:bg-cta-hi" aria-label="Search">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4.5 4.5" strokeLinecap="round" />
              </svg>
            </button>
          </form>

          <nav aria-label="Shop" className="flex items-center gap-1 justify-self-end">
            <AskButton className="hidden h-11 items-center rounded-[8px] border border-white/60 px-3.5 text-[15px] font-semibold hover:bg-brand-deep sm:flex">
              Ask Aai
            </AskButton>
            <Link href="/about" className="hidden rounded-[6px] px-3 py-2 text-[15px] hover:bg-brand-deep xl:block">
              Our story
            </Link>
            <Link href="/checkout" className="flex items-center gap-2 rounded-[8px] px-2.5 py-1 hover:bg-brand-deep" aria-label={`Cart, ${count} packet${count === 1 ? "" : "s"}`}>
              <span className="relative">
                <CartGlyph />
                {count > 0 && (
                  <span className="num absolute -right-2 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-cta px-1 text-[12px] font-bold text-ink">
                    {count}
                  </span>
                )}
              </span>
              <span className="hidden flex-col leading-tight sm:flex">
                <span className="text-[13px] text-white/80">Cart</span>
                <span className="num text-[15px] font-semibold">{cart ? formatUSD(cart.subtotalCents) : "$0.00"}</span>
              </span>
            </Link>
          </nav>
        </div>

        {withCategories && (
          <nav aria-label="Categories" className="bg-brand-deep">
            <ul className="mx-auto flex max-w-[1320px] gap-1 overflow-x-auto px-4 sm:px-6">
              {CATEGORIES.map((c) => {
                const active = cat === c.id;
                const href = c.id === "all" ? (q ? `/?q=${encodeURIComponent(q)}` : "/") : `/?c=${c.id}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
                return (
                  <li key={c.id}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`flex h-10 items-center gap-1.5 whitespace-nowrap border-b-[3px] px-3 text-[15px] ${active ? "border-cta font-semibold" : "border-transparent text-white/90 hover:text-white"}`}
                    >
                      {c.label}{" "}
                      <span lang="mr" className="mr text-white/75">
                        {c.mr}
                      </span>
                    </Link>
                  </li>
                );
              })}
              <li className="ml-auto hidden md:block">
                <span className="flex h-10 items-center px-3 text-[15px] text-cta">Free postage on orders over $100</span>
              </li>
            </ul>
          </nav>
        )}
      </header>
      <ChatDrawer />
    </>
  );
}
