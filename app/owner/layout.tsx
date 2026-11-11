import Link from "next/link";
import { cookies } from "next/headers";
import { isOwner } from "@/lib/owner-session";
import { logout } from "@/app/owner/actions";
import { OWNER_LANG_COOKIE, ownerDict, parseOwnerLang } from "@/lib/owner/i18n";
import { OwnerLangProvider, LangToggle } from "@/components/owner/OwnerLang";
import { OwnerNav } from "@/components/owner/OwnerNav";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const loggedIn = await isOwner(); // the login page renders inside this layout too
  const lang = parseOwnerLang((await cookies()).get(OWNER_LANG_COOKIE)?.value);
  const t = ownerDict(lang);
  return (
    <OwnerLangProvider lang={lang}>
      <div lang={lang === "mr" ? "mr" : "en"} className="flex min-h-full flex-1 flex-col">
        <header className="bg-brand text-white">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-6">
            <div className="flex min-w-0 items-center gap-4">
              <Link href="/owner" className="type-sign whitespace-nowrap text-xl leading-none text-cta">
                {t.bar}
              </Link>
              {loggedIn && <OwnerNav />}
            </div>
            <div className="flex items-center gap-2">
              <LangToggle />
              {loggedIn && (
                <form action={logout}>
                  <button className="h-10 whitespace-nowrap rounded-[6px] px-3 text-[15px] font-semibold text-white underline underline-offset-4 hover:bg-brand-deep">
                    {t.logout}
                  </button>
                </form>
              )}
            </div>
          </div>
        </header>
        {children}
      </div>
    </OwnerLangProvider>
  );
}
