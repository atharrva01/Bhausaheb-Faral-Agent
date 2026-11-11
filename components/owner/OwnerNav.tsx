"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOwnerLang } from "@/components/owner/OwnerLang";

export function OwnerNav() {
  const pathname = usePathname();
  const { t } = useOwnerLang();
  const links = [
    { href: "/owner", label: t.navToday },
    { href: "/owner/assistant", label: t.navAsk },
  ];
  return (
    <nav aria-label="Shop side" className="flex gap-1">
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`flex h-10 items-center rounded-[8px] px-3 text-[15px] font-semibold ${active ? "bg-white text-brand" : "text-white hover:bg-brand-deep"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
