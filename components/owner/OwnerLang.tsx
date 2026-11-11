"use client";

import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { ownerDict, type OwnerDict, type OwnerLang } from "@/lib/owner/i18n";
import { setOwnerLang } from "@/app/owner/actions";

const Ctx = createContext<{ lang: OwnerLang; t: OwnerDict }>({ lang: "en", t: ownerDict("en") });

export function OwnerLangProvider({ lang, children }: { lang: OwnerLang; children: React.ReactNode }) {
  return <Ctx.Provider value={{ lang, t: ownerDict(lang) }}>{children}</Ctx.Provider>;
}

export function useOwnerLang() {
  return useContext(Ctx);
}

/** English | मराठी switch. Stores the choice in a cookie and re-renders the server parts too. */
export function LangToggle() {
  const { lang } = useOwnerLang();
  const router = useRouter();
  async function choose(l: OwnerLang) {
    await setOwnerLang(l);
    router.refresh();
  }
  return (
    <div role="radiogroup" aria-label="Language" className="flex overflow-hidden rounded-[8px] border border-white/60 text-[15px]">
      {(["en", "mr"] as const).map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={lang === l}
          lang={l === "mr" ? "mr" : "en"}
          onClick={() => choose(l)}
          className={`h-10 px-3 font-semibold ${lang === l ? "bg-white text-brand" : "text-white hover:bg-brand-deep"} ${l === "mr" ? "mr" : ""}`}
        >
          {l === "en" ? "English" : "मराठी"}
        </button>
      ))}
    </div>
  );
}
