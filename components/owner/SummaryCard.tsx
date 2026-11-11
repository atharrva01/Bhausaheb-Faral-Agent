"use client";

import { useState } from "react";

type State = { status: "idle" | "loading" | "done" | "error"; text?: string; lang?: "en" | "mr"; at?: string; message?: string };

/** "Today's summary" button (PRD O2). Never calls the LLM on page load: only on click. */
export function SummaryCard() {
  const [lang, setLang] = useState<"en" | "mr">("en");
  const [state, setState] = useState<State>({ status: "idle" });

  async function load(l: "en" | "mr") {
    setLang(l);
    setState({ status: "loading" });
    const res = await fetch(`/api/owner/summary?lang=${l}`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setState({ status: "error", message: json.message ?? "Could not get the summary." });
    setState({ status: "done", text: json.text, lang: json.lang, at: json.generatedAt });
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Today&apos;s summary</h2>
          <p className="text-xs text-muted">Written by AI from today&apos;s orders. Numbers come from the database.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-full border border-line text-sm" role="radiogroup" aria-label="Summary language">
            {(["en", "mr"] as const).map((l) => (
              <button
                key={l}
                role="radio"
                aria-checked={lang === l}
                onClick={() => (state.status === "idle" ? setLang(l) : load(l))}
                className={`px-3 py-1.5 ${lang === l ? "bg-maroon text-cream" : "hover:bg-cream-deep"}`}
              >
                {l === "en" ? "English" : "मराठी"}
              </button>
            ))}
          </div>
          <button
            onClick={() => load(lang)}
            disabled={state.status === "loading"}
            className="rounded-full bg-saffron px-4 py-1.5 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-60"
          >
            {state.status === "loading" ? "Writing…" : state.status === "idle" ? "Get today's summary" : "Refresh"}
          </button>
        </div>
      </div>

      {state.status === "done" && (
        <div lang={state.lang} className="mt-4 space-y-1.5 rounded-xl bg-cream p-4 text-[15px] leading-relaxed">
          {state.text!.split("\n").filter((l) => l.trim()).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}
      {state.status === "loading" && <div className="mt-4 h-28 animate-pulse rounded-xl bg-cream" />}
      {state.status === "error" && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{state.message}</p>}
    </section>
  );
}
