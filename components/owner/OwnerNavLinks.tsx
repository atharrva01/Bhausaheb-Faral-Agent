"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/owner", label: "Dashboard" },
  { href: "/owner/assistant", label: "Assistant" },
];

export function OwnerNavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 text-sm">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`rounded-full px-3 py-1 ${pathname === l.href ? "bg-cream/15 font-semibold" : "text-cream/80 hover:bg-cream/10"}`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
