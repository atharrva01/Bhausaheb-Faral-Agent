import Link from "next/link";
import { isOwner } from "@/lib/owner-session";
import { logout } from "@/app/owner/actions";
import { OwnerNavLinks } from "@/components/owner/OwnerNavLinks";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const loggedIn = await isOwner(); // login page renders inside this layout too
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#faf5ec]">
      <header className="sticky top-0 z-40 bg-ink text-cream">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-4">
            <Link href="/owner" className="flex items-center font-display text-lg leading-none">
              <span className="hidden sm:inline">Bhausaheb Faral</span>
              <span className="sm:hidden">Faral</span> <span className="ml-1 rounded bg-saffron px-1.5 py-0.5 font-sans text-[11px] font-bold uppercase tracking-wide text-white">Owner</span>
            </Link>
            {loggedIn && <OwnerNavLinks />}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="hidden rounded-full px-3 py-1 text-cream/80 hover:bg-cream/10 sm:inline">
              View shop
            </Link>
            {loggedIn && (
              <form action={logout}>
                <button className="rounded-full border border-cream/30 px-3 py-1 hover:bg-cream/10">Log out</button>
              </form>
            )}
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
