"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { OwnerUIMessage } from "@/app/api/owner/chat/route";
import type { ActionCard as ActionCardData } from "@/lib/owner/actions";
import { RichText } from "@/components/counter/RichText";

const SUGGESTIONS = [
  "What orders are pending?",
  "How much did we make this week?",
  "Mark order #1027 as shipped with India Post tracking EE123456789IN",
  "Send a PayPal invoice to rohan@example.com for 1 kg chakli",
  "Which items are running low?",
];

const TOOL_LABEL: Record<string, string> = {
  "tool-list_orders": "Looking at orders…",
  "tool-get_order": "Opening the order…",
  "tool-sales_stats": "Adding up sales…",
  "tool-low_stock": "Checking stock…",
  "tool-price_items": "Pricing items…",
  "tool-paypal_order_status": "Asking PayPal…",
  "tool-paypal_list_invoices": "Fetching PayPal invoices…",
  "tool-propose_action": "Preparing the action…",
};

type Part = OwnerUIMessage["parts"][number];

export function OwnerAssistant() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status, error, regenerate, clearError } = useChat<OwnerUIMessage>({
    transport: new DefaultChatTransport({ api: "/api/owner/chat" }),
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    if (error) clearError();
    void sendMessage({ text: t });
    setInput("");
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-52px)] w-full max-w-3xl flex-col px-0 sm:px-4 sm:py-4">
      <div data-chat-status={status} className="flex flex-1 flex-col overflow-hidden border-line bg-white sm:rounded-2xl sm:border">
        <header className="border-b border-line px-4 py-3">
          <h1 className="font-display text-2xl text-maroon">Owner assistant</h1>
          <p className="text-xs text-muted">
            Ask about orders and sales, or ask it to ship an order or send a PayPal invoice. Nothing changes until you press <strong>Confirm</strong>.
          </p>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[#faf5ec] px-3 py-4 sm:px-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted">Try one of these:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-full border border-line bg-white px-3 py-1.5 text-left text-sm hover:border-saffron">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <Message key={m.id} message={m} />
          ))}

          {status === "submitted" && <p className="text-sm text-muted">Thinking…</p>}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <p>{error.message || "Something went wrong."}</p>
              <button onClick={() => regenerate()} className="mt-2 font-semibold underline">
                Try again
              </button>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2 border-t border-line p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. what should I pack first today?"
            className="min-w-0 flex-1 rounded-full border border-line bg-cream px-4 py-2.5 outline-none focus:border-saffron"
            aria-label="Message"
            autoFocus
          />
          <button disabled={busy || !input.trim()} className="rounded-full bg-maroon px-5 font-semibold text-cream disabled:opacity-40">
            Send
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
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-ink px-3.5 py-2 text-[15px] text-cream">
          {message.parts.map((p) => (p.type === "text" ? p.text : "")).join("")}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {message.parts.map((part: Part, i) => {
        if (part.type === "text") {
          return part.text.trim() ? (
            <div key={i} className="max-w-[90%] rounded-2xl rounded-bl-sm border border-line bg-white px-3.5 py-2 text-[15px] leading-snug">
              <RichText text={part.text} />
            </div>
          ) : null;
        }
        if (!part.type.startsWith("tool-")) return null;
        const tp = part as Extract<Part, { type: `tool-${string}` }>;
        if (tp.state === "input-streaming" || tp.state === "input-available") {
          return (
            <p key={i} className="flex items-center gap-2 text-xs text-muted">
              <span className="h-2 w-2 animate-pulse rounded-full bg-saffron" />
              {TOOL_LABEL[tp.type] ?? "Working…"}
            </p>
          );
        }
        if (tp.type === "tool-propose_action" && tp.state === "output-available") {
          const out = tp.output as ActionCardData;
          return out.ok ? <ActionCard key={i} card={out} /> : null;
        }
        return null;
      })}
    </div>
  );
}

/** Confirm/Cancel card. Sends only the action id; the server holds the validated, priced payload. */
function ActionCard({ card }: { card: Extract<ActionCardData, { ok: true }> }) {
  const [state, setState] = useState<{ status: "PENDING" | "WORKING" | "EXECUTED" | "FAILED" | "CANCELLED"; message?: string }>({ status: "PENDING" });

  async function decide(decision: "confirm" | "cancel") {
    setState({ status: "WORKING" });
    const res = await fetch("/api/owner/actions/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionId: card.actionId, decision }),
    });
    const json = await res.json().catch(() => ({ status: "FAILED", message: "Network error" }));
    setState({ status: json.status, message: json.message });
  }

  const tone =
    state.status === "EXECUTED"
      ? "border-leaf bg-leaf/5"
      : state.status === "FAILED"
        ? "border-red-300 bg-red-50"
        : state.status === "CANCELLED"
          ? "border-line bg-cream opacity-75"
          : "border-saffron bg-white";

  return (
    <div className={`max-w-md rounded-2xl border-2 p-4 text-sm shadow-sm ${tone}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-saffron">{card.type === "create_invoice" ? "PayPal invoice" : "Order update"} · needs your OK</p>
      <p className="mt-1 text-base font-semibold">{card.title}</p>
      <ul className="mt-2 space-y-1 text-muted">
        {card.details.map((d, i) => (
          <li key={i}>{d}</li>
        ))}
      </ul>

      {state.status === "PENDING" || state.status === "WORKING" ? (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => decide("confirm")}
            disabled={state.status === "WORKING"}
            className="flex-1 rounded-lg bg-leaf py-2 font-semibold text-white hover:brightness-110 disabled:opacity-60"
          >
            {state.status === "WORKING" ? "Working…" : "Confirm"}
          </button>
          <button
            onClick={() => decide("cancel")}
            disabled={state.status === "WORKING"}
            className="rounded-lg border border-line px-4 py-2 font-semibold hover:bg-cream-deep disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      ) : (
        <p
          className={`mt-3 rounded-lg px-3 py-2 font-semibold ${
            state.status === "EXECUTED" ? "bg-leaf/10 text-leaf" : state.status === "FAILED" ? "text-red-700" : "text-muted"
          }`}
        >
          {state.status === "EXECUTED" ? "✓ Done. " : state.status === "FAILED" ? "✗ Failed. " : ""}
          {state.message}
        </p>
      )}
    </div>
  );
}
