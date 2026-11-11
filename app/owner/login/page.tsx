import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LoginForm } from "./LoginForm";
import { OWNER_LANG_COOKIE, ownerDict, parseOwnerLang } from "@/lib/owner/i18n";

export const metadata: Metadata = { title: "Shop side · Bhausaheb Faral" };

export default async function OwnerLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const t = ownerDict(parseOwnerLang((await cookies()).get(OWNER_LANG_COOKIE)?.value));
  return (
    <main className="mx-auto w-full max-w-[420px] flex-1 px-4 py-14">
      <h1 className="type-title text-[30px] sm:text-[40px]">{t.loginTitle}</h1>
      <p className="mb-7 mt-2 text-lg">{t.loginHelp}</p>
      <LoginForm next={next ?? "/owner"} />
    </main>
  );
}
