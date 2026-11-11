"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { OwnerUIMessage } from "@/app/api/owner/chat/route";
import type { ActionCard as ActionCardData } from "@/lib/owner/actions";
import { RichText } from "@/components/counter/RichText";
import { ShopStamp } from "@/components/bill/ShopStamp";
import { useOwnerLang } from "@/components/owner/OwnerLang";

const SUGGESTIONS = [
  "What orders are pending?",
  "How much did we make this week?",
  "Mark order #1027 as shipped with India Post tracking EE123456789IN",
  "Send a PayPal invoice to rohan@example.com for 1 kg chakli",
  "Which barnis are running low?",
];

// What the shop book says while a tool runs: plain words, never tool names.
const ACTIVITY: Record<string, string> = {
  "tool-list_orders": "Opening the order book…",
  "tool-get_order": "Finding that bill…",
  "tool-sales_stats": "Totting up the khata…",
  "tool-low_stock": "Checking the barnis…",
  "tool-price_items": "Weighing it out…",
  "tool-paypal_order_status": "Asking PayPal…",
  "tool-paypal_list_invoices": "Fetching PayPal invoices…",
  "tool-propose_action": "Writing it up for you to check…",
};

type Part = OwnerUIMessage["parts"][number];

export function OwnerAssistant() {
  const { t } = useOwnerLang();
  const [input, setInput] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status, error, regenerate, clearError } = useChat<OwnerUIMessage>({
    transport: new DefaultChatTransport({ api: "/api/owner/chat" }),
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  function send(text: string) {
    const v = text.trim();
    if (!v || busy) return;
    if (error) clearError();
    void sendMessage({ text: v });
    setInput("");
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-58px)] w-full max-w-[820px] flex-col px-4 py-5 sm:px-6">
      <div data-chat-status={status} className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-line bg-page p-4">
        <div className="shrink-0 border-b border-line pb-3">
          <h1 className="type-head text-[26px]">{t.askTitle}</h1>
          <p className="text-[15px] text-muted">{t.askIntro}</p>
        </div>

        <div ref={logRef} role="log" aria-live="polite" className="min-h-0 flex-1 space-y-4 overflow-y-auto py-4">
          {messages.length === 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Things you can ask">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => send(s)}
                    className="min-h-11 rounded-full border border-accent/40 bg-card px-4 py-2 text-left text-[15px] text-accent hover:border-accent hover:bg-mint"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {messages.map((m) => (
            <Message key={m.id} message={m} />
          ))}

          {status === "submitted" && <p className="text-muted">Looking in the khata…</p>}
          {error && (
            <div role="alert" className="rounded-[8px] border border-danger/60 bg-soft p-3">
              <p>{error.message || "The shop book didn't answer. Ask again."}</p>
              <button type="button" onClick={() => regenerate()} className="mt-2 h-11 rounded-[6px] bg-cta px-4 font-semibold text-ink">
                Ask again
              </button>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex shrink-0 gap-2 border-t border-line pt-3"
        >
          <label htmlFor="ask-input" className="sr-only">
            {t.askPlaceholder}
          </label>
          <input
            id="ask-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.askPlaceholder}
            autoComplete="off"
            className="h-12 min-w-0 flex-1 rounded-[8px] border border-line bg-soft px-3.5 text-base text-ink placeholder:text-mutedd"
          />
          <button type="submit" disabled={busy || !input.trim()} className="h-12 rounded-full bg-brand px-5 font-semibold text-white hover:bg-brand-deep disabled:bg-soft disabled:text-muted">
            {t.send}
          </button>
        </form>
      </div>
    </div>
  );
}

function Message({ message }: { message: OwnerUIMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-[14px_4px_14px_14px] bg-brand px-3.5 py-2 text-white">
          <span className="sr-only">You: </span>
          {message.parts.map((p) => (p.type === "text" ? p.text : "")).join("")}
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {message.parts.map((part: Part, i) => {
        if (part.type === "text") {
          return part.text.trim() ? (
            <div key={i} className="max-w-[92%] rounded-[4px_14px_14px_14px] bg-card px-3.5 py-2.5 leading-relaxed shadow-[0_1px_2px_rgb(28_27_25/0.08)]">
              <RichText text={part.text} />
            </div>
          ) : null;
        }
        if (!part.type.startsWith("tool-")) return null;
        const tp = part as Extract<Part, { type: `tool-${string}` }>;
        if (tp.state === "input-streaming" || tp.state === "input-available") {
          return (
            <p key={i} className="flex items-center gap-2 text-[15px] text-muted">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
              {ACTIVITY[tp.type] ?? "One moment…"}
            </p>
          );
        }
        if (tp.type === "tool-propose_action" && tp.state === "output-available") {
          const out = tp.output as ActionCardData;
          return out.ok ? <ActionSlip key={i} card={out} /> : null;
        }
        return null;
      })}
    </div>
  );
}

/** A slip for the owner to approve. Sends only the action id; the server holds the checked, priced details. */
function ActionSlip({ card }: { card: Extract<ActionCardData, { ok: true }> }) {
  const { t } = useOwnerLang();
  const [state, setState] = useState<{ status: "PENDING" | "WORKING" | "EXECUTED" | "FAILED" | "CANCELLED"; message?: string }>({ status: "PENDING" });

  async function decide(decision: "confirm" | "cancel") {
    setState({ status: "WORKING" });
    const res = await fetch("/api/owner/actions/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionId: card.actionId, decision }),
    });
    const json = await res.json().catch(() => ({ status: "FAILED", message: "No answer from the server. Try again." }));
    setState({ status: json.status, message: json.message });
  }

  return (
    <div className="slip-wrap relative max-w-[460px]">
      <section className="slip on-paper px-5 pb-5" aria-label={card.title}>
        <p className="border-b-2 border-khata pb-1.5 text-sm text-pencil">
          {card.type === "create_invoice" ? "PayPal invoice" : "Order update"}, needs your OK
        </p>
        <p className="mt-2 text-lg font-semibold leading-snug">{card.title}</p>
        <ul className="mt-2 space-y-1 text-[15px] text-pencil">
          {card.details.map((d, i) => (
            <li key={i} className="border-b border-rule-paper pb-1 last:border-b-0">
              {d}
            </li>
          ))}
        </ul>

        {state.status === "PENDING" || state.status === "WORKING" ? (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => decide("confirm")}
              disabled={state.status === "WORKING"}
              className="h-12 flex-1 rounded-[8px] bg-brand px-4 font-semibold text-white hover:bg-brand-deep disabled:opacity-60"
            >
              {state.status === "WORKING" ? "…" : card.confirmLabel}
            </button>
            <button
              type="button"
              onClick={() => decide("cancel")}
              disabled={state.status === "WORKING"}
              className="h-12 rounded-[8px] border border-ink/40 px-4 font-semibold hover:bg-rule-paper disabled:opacity-60"
            >
              {t.notNow}
            </button>
          </div>
        ) : (
          <div role="status" className="mt-4 flex items-center gap-3">
            {state.status === "EXECUTED" && <ShopStamp label={card.doneLabel} center="नोंद केली" sub={card.doneLabel} size={96} />}
            <p className={`font-semibold ${state.status === "FAILED" ? "text-khata" : state.status === "EXECUTED" ? "text-stamp" : "text-pencil"}`}>
              {state.status === "EXECUTED" ? `${card.doneLabel}. ` : state.status === "CANCELLED" ? `${t.leftAsItWas} ` : "Didn't go through. "}
              <span className="font-normal">{state.status === "CANCELLED" ? "" : state.message}</span>
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
