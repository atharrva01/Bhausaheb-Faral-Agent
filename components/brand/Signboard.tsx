"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/shop/CartProvider";

/**
 * The shop's painted tin board: khata red, haldi lettering, a painted inset frame.
 * Signboard proportions only (not a hero). `slim` on inner pages.
 */
export function Signboard({ slim = false }: { slim?: boolean }) {
  const { cart } = useCart();
  const pathname = usePathname();
  const count = cart?.itemCount ?? 0;

  const links = [
    { href: "/", label: "Today's rates" },
    { href: "/about", label: "Our story" },
    { href: "/checkout", label: count > 0 ? `Your bill (${count})` : "Your bill" },
  ];

  return (
    <header className="bg-khata p-1.5 text-paper sm:p-2">
      <div className="border-2 border-haldi/85">
        <div className={`mx-auto flex max-w-[1280px] flex-col gap-3 px-3 sm:px-5 lg:flex-row lg:items-end lg:justify-between ${slim ? "py-2.5" : "py-4 sm:py-5"}`}>
          <Link href="/" className="group block min-w-0" aria-label="Bhausaheb General Kirana Stores, today's rates">
            <span lang="mr" className={`type-sign block leading-[0.95] text-haldi ${slim ? "text-[26px] sm:text-[32px]" : "text-[34px] sm:text-[56px]"}`}>
              भाऊसाहेब जनरल किराणा स्टोर्स
            </span>
            <span className={`mt-1 block text-paper/90 ${slim ? "text-sm" : "text-[15px] sm:text-base"}`}>
              Bhausaheb General Kirana Stores, opposite the bus depot, Karjat
            </span>
          </Link>
          <nav aria-label="Shop" className="-mx-1 flex flex-wrap gap-x-1 text-[15px]">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`num rounded-[3px] px-2 py-1.5 ${active ? "bg-paper font-semibold text-khata" : "text-paper hover:bg-khata-deep"}`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
