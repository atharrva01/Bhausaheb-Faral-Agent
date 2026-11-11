"use client";

import { useState } from "react";
import { useOwnerLang } from "@/components/owner/OwnerLang";

type State = { status: "idle" | "loading" | "done" | "error"; text?: string; message?: string };

/** Aai's note for today (PRD O2). The LLM is only called on click; language follows the English/मराठी switch. */
export function SummaryCard() {
  const { lang, t } = useOwnerLang();
  const [state, setState] = useState<State & { lang?: string }>({ status: "idle" });

  async function write() {
    setState({ status: "loading" });
    const res = await fetch(`/api/owner/summary?lang=${lang}`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setState({ status: "error", message: json.message ?? "The note couldn't be written. Try again in a few seconds." });
    setState({ status: "done", text: json.text, lang });
  }
  const stale = state.status === "done" && state.lang !== lang;

  return (
    <section aria-labelledby="note-heading" className="rounded-[12px] border border-line bg-card p-4">
      <h2 id="note-heading" className="type-head text-xl text-accent">
        {t.note}
      </h2>
      <p className="mt-0.5 text-[14px] text-muted">{t.noteHelp}</p>
      {state.status === "done" && state.text && (
        <div lang={state.lang} className={`mt-3 space-y-2 leading-relaxed ${state.lang === "mr" ? "mr" : ""}`} aria-live="polite">
          {state.text.split("\n").filter((l) => l.trim()).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}
      {state.status === "loading" && <p className="mt-3 text-muted" role="status">{t.writingNote}</p>}
      {state.status === "error" && <p role="alert" className="mt-3 text-danger">{state.message}</p>}
      <button
        type="button"
        onClick={write}
        disabled={state.status === "loading"}
        className="mt-4 h-12 w-full rounded-[6px] border border-accent px-4 font-semibold text-accent hover:bg-soft disabled:opacity-60"
      >
        {state.status === "idle" || stale ? t.writeNote : t.rewriteNote}
      </button>
    </section>
  );
}
