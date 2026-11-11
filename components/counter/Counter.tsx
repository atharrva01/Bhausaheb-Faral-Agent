"use client";

import { useEffect, useRef, useState } from "react";
import type { CustomerUIMessage } from "@/app/api/chat/route";
import type { CartView } from "@/lib/ai/customer-tools";
import { useCounterChat } from "@/components/counter/CounterChatProvider";
import { RichText } from "@/components/counter/RichText";
import { Bill } from "@/components/bill/Bill";
import { billFromCartView } from "@/components/bill/cartToBill";
import { PayPalCheckout } from "@/components/checkout/PayPalCheckout";
import { RunningBill } from "@/components/shop/RunningBill";
import { SHIPPING_RATES, isSupportedCountry } from "@/lib/shipping";

const SUGGESTIONS = [
  "2 chakli and 1 kilo besan ladoo to New Jersey",
  "1 kilo ladoo aur 2 packet chivda Dubai bhejna hai",
  "Which ones have no ghee?",
];

type Part = CustomerUIMessage["parts"][number];
type ToolPart = Extract<Part, { type: `tool-${string}` }>;

/** What the shop says while a tool runs. Plain words from the counter, never tool names. */
function activity(p: ToolPart): string {
  switch (p.type) {
    case "tool-update_cart":
      return "Adding to your bill…";
    case "tool-get_cart":
      return "Reading your bill…";
    case "tool-quote_shipping": {
      const c = (p.input as { country?: string } | undefined)?.country?.toUpperCase();
      const name = c && isSupportedCountry(c) ? SHIPPING_RATES[c].name : null;
      return name ? `Checking postage to ${name}…` : "Checking postage…";
    }
    case "tool-get_product":
      return "Asking Aai what goes into it…";
    case "tool-create_checkout":
      return "Writing your bill and opening PayPal…";
    case "tool-get_order_status":
      return "Looking up your bill in the order book…";
    default:
      return "One moment…";
  }
}

/**
 * At the counter: the ordering chat as a part of the page (never a corner widget).
 * `withBill` shows the running bill under the conversation (desktop column).
 */
export function Counter({ withBill = false, className = "" }: { withBill?: boolean; className?: string }) {
  const { messages, sendMessage, status, error, regenerate, clearError } = useCounterChat();
  const [input, setInput] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    if (error) clearError();
    void sendMessage({ text: t });
    setInput("");
  }

  return (
    <section id="counter" aria-labelledby="counter-heading" data-chat-status={status} className={`flex min-h-0 flex-col ${className}`}>
      <h2 id="counter-heading" className="type-head shrink-0 border-b-2 border-ink pb-2 text-2xl">
        At the counter
      </h2>

      <div ref={logRef} role="log" aria-live="polite" aria-relevant="additions" className="min-h-0 flex-1 space-y-4 overflow-y-auto py-4 pr-1">
        <ShopLine>
          Namaskar. Tell me what to pack and where it&apos;s going. English, Hinglish or Marathi, &ldquo;do packet chakli, Dubai&rdquo; works too.
        </ShopLine>
        {messages.length === 0 && (
          <ul className="space-y-1 pl-4" aria-label="Things you can say">
            {SUGGESTIONS.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => send(s)}
                  className="min-h-11 w-full rounded-[3px] px-2 py-1.5 text-left text-stamp underline decoration-stamp/40 underline-offset-4 hover:bg-paper hover:decoration-stamp"
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

        {status === "submitted" && <p className="pl-4 text-[15px] text-pencil">The shop is writing…</p>}

        {error && (
          <div role="alert" className="border-l-[3px] border-khata pl-3">
            <p>{error.message || "The counter didn't hear that. Send it again; your bill is safe."}</p>
            <button type="button" onClick={() => regenerate()} className="mt-2 h-10 rounded-[4px] border-[1.5px] border-ink px-3 font-semibold hover:bg-paper">
              Send again
            </button>
          </div>
        )}
      </div>

      {/* Desktop only: on phones the bill lives in the bottom bar's sheet. */}
      {withBill && (
        <div className="hidden max-h-[58%] shrink-0 overflow-y-auto px-1 pb-3 pt-2 lg:block">
          <RunningBill compact animateIn />
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex shrink-0 gap-2 border-t border-rule pt-3"
      >
        <label htmlFor="counter-input" className="sr-only">
          Message to the shop
        </label>
        <input
          id="counter-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type to the shop…"
          autoComplete="off"
          className="h-12 min-w-0 flex-1 rounded-[3px] border-[1.5px] border-pencil bg-paper px-3.5 text-base outline-none focus-visible:outline-2 focus-visible:outline-stamp"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="h-12 rounded-[4px] border-[1.5px] border-ink bg-ink px-5 font-semibold text-paper disabled:border-pencil disabled:bg-transparent disabled:text-pencil"
        >
          Send
        </button>
      </form>
    </section>
  );
}

function ShopLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-[3px] border-khata pl-3 leading-relaxed">
      <span className="sr-only">Shop: </span>
      {children}
    </div>
  );
}

function Message({ message }: { message: CustomerUIMessage }) {
  if (message.role === "user") {
    const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-[10px_10px_2px_10px] border border-rule-paper bg-paper px-3.5 py-2">
          <span className="sr-only">You: </span>
          {text}
        </p>
      </div>
    );
  }

  // Several cart tools can run in one reply: show only the latest bill.
  const cartParts = message.parts.filter(isCartResult);
  const lastCart = cartParts[cartParts.length - 1];

  return (
    <div className="space-y-3">
      {message.parts.map((part, i) => {
        if (part.type === "text") return part.text.trim() ? <ShopLine key={i}><RichText text={part.text} /></ShopLine> : null;
        if (!part.type.startsWith("tool-")) return null;
        const tp = part as ToolPart;
        if (tp.state === "input-streaming" || tp.state === "input-available") {
          return <p key={i} className="pl-4 text-[15px] text-pencil">{activity(tp)}</p>;
        }
        if (tp.state !== "output-available") return null;

        if (isCartResult(tp) && tp === lastCart) {
          const out = tp.output as CartView & { supported?: boolean };
          if (out.supported === false || out.lines.length === 0) return null;
          const b = billFromCartView(out);
          return <Bill key={i} compact label="Bill so far" lines={b.lines} postage={b.postage} totalCents={b.totalCents} />;
        }
        if (tp.type === "tool-create_checkout") {
          const out = tp.output;
          if (!out.ok) return null;
          return (
            <Bill key={i} compact label={`Bill ${out.orderNumber}`} number={out.orderNumber.replace("#", "")} lines={[]} emptyText={`Total ${out.total}. Pay below and the bill is done.`}>
              <PayPalCheckout orderId={out.orderId} orderNumber={out.orderNumber} paypalOrderId={out.paypalOrderId} totalCents={out.totalCents} />
            </Bill>
          );
        }
        return null;
      })}
    </div>
  );
}

function isCartResult(p: Part) {
  return (p.type === "tool-update_cart" || p.type === "tool-get_cart" || p.type === "tool-quote_shipping") && "state" in p && p.state === "output-available";
}
