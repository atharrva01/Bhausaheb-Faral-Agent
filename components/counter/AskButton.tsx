"use client";

import { openAssistant } from "@/components/counter/events";

export function AskButton({ className, children, text }: { className?: string; children: React.ReactNode; text?: string }) {
  return (
    <button type="button" className={className} onClick={() => openAssistant(text)}>
      {children}
    </button>
  );
}

/** "Ask Aai" input: type what you want; it opens the assistant with that message already sent. */
export function AskBar({ className = "" }: { className?: string }) {
  return (
    <form
      className={`flex h-14 w-full overflow-hidden rounded-[10px] border-2 border-brand bg-card ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        const input = e.currentTarget.elements.namedItem("ask") as HTMLInputElement;
        const v = input.value.trim();
        openAssistant(v || undefined);
        input.value = "";
      }}
    >
      <label htmlFor="ask-bar" className="sr-only">
        Tell Aai what you want
      </label>
      <input id="ask-bar" name="ask" placeholder="e.g. 2 chakli and 1 kilo ladoo to New Jersey" autoComplete="off" className="min-w-0 flex-1 bg-transparent px-4 text-base text-ink placeholder:text-muted focus-visible:outline-none" />
      <button type="submit" className="bg-brand px-5 font-semibold text-white hover:bg-brand-deep">
        Ask Aai
      </button>
    </form>
  );
}
