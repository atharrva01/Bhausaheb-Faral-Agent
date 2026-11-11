"use client";

import { useEffect, useRef, useState } from "react";
import type { CustomerUIMessage } from "@/app/api/chat/route";
import type { CartView } from "@/lib/ai/customer-tools";
import { useCounterChat } from "@/components/counter/CounterChatProvider";
import { RichText } from "@/components/counter/RichText";
import { ChatCartCard } from "@/components/counter/ChatCartCard";
import { OPEN_ASSISTANT_EVENT, type OpenAssistantDetail } from "@/components/counter/events";
import { PayPalCheckout } from "@/components/checkout/PayPalCheckout";
import { SHIPPING_RATES, isSupportedCountry } from "@/lib/shipping";

const STARTERS = ["2 chakli and 1 kilo besan ladoo to New Jersey", "1 kilo ladoo aur 2 packet chivda Dubai bhejna hai", "Which ones have no ghee?", "Where is my order?"];
const FOLLOW_UPS = ["Add 1 more chakli", "Make it 2 kilo ladoo", "What's the total?"];

type Part = CustomerUIMessage["parts"][number];
type ToolPart = Extract<Part, { type: `tool-${string}` }>;

function activity(p: ToolPart): string {
  switch (p.type) {
    case "tool-update_cart":
      return "Adding to your cart";
    case "tool-get_cart":
      return "Checking your cart";
    case "tool-quote_shipping": {
      const c = (p.input as { country?: string } | undefined)?.country?.toUpperCase();
      return c && isSupportedCountry(c) ? `Working out postage to ${SHIPPING_RATES[c].name}` : "Working out postage";
    }
    case "tool-get_product":
      return "Asking Aai what goes into it";
    case "tool-create_checkout":
      return "Setting up your PayPal payment";
    case "tool-get_order_status":
      return "Looking up your order";
    default:
      return "One moment";
  }
}

function Avatar() {
  return (
    <span aria-hidden="true" lang="mr" className="mr flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-[15px] text-white">
      आ
    </span>
  );
}

/** "Ask Aai": the ordering assistant. Renders inside the slide-over (ChatDrawer). */
export function Counter({ className = "" }: { className?: string }) {
  const { messages, sendMessage, status, error, regenerate, clearError } = useCounterChat();
  const [input, setInput] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  function send(text: string) {
    const v = text.trim();
    if (!v || busy) return;
    if (error) clearError();
    void sendMessage({ text: v });
    setInput("");
  }

  // Messages typed into the banner's ask bar arrive here.
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  });
  useEffect(() => {
    const onOpen = (e: Event) => {
      const text = (e as CustomEvent<OpenAssistantDetail>).detail?.text;
      if (text) sendRef.current(text);
      setTimeout(() => inputRef.current?.focus(), 50);
    };
    window.addEventListener(OPEN_ASSISTANT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_ASSISTANT_EVENT, onOpen);
  }, []);

  const last = messages[messages.length - 1];
  const showFollowUps = !busy && last?.role === "assistant";

  return (
    <section aria-label="Chat with Aai" data-chat-status={status} className={`flex min-h-0 flex-col ${className}`}>
      <div ref={logRef} role="log" aria-live="polite" aria-relevant="additions" className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <AssistantRow>
          <p>
            Namaskar! I&apos;m Aai&apos;s ordering assistant. Tell me what you&apos;d like and where to send it. English, Hinglish or Marathi all work.
          </p>
        </AssistantRow>
        {messages.length === 0 && <Chips items={STARTERS} onPick={send} label="Try asking" />}

        {messages.map((m) => (
          <Message key={m.id} message={m} />
        ))}

        {status === "submitted" && (
          <AssistantRow>
            <p className="text-muted">Typing…</p>
          </AssistantRow>
        )}

        {error && (
          <div role="alert" className="rounded-[10px] border border-danger/40 bg-card p-3">
            <p className="text-danger">{error.message || "That didn't go through. Send it again; your cart is safe."}</p>
            <button type="button" onClick={() => regenerate()} className="mt-2 h-10 rounded-[8px] bg-cta px-4 font-semibold text-ink hover:bg-cta-hi">
              Send again
            </button>
          </div>
        )}

        {showFollowUps && <Chips items={FOLLOW_UPS} onPick={send} label="Quick replies" />}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex shrink-0 gap-2 border-t border-line bg-card p-3"
      >
        <label htmlFor="counter-input" className="sr-only">
          Message Aai
        </label>
        <input
          id="counter-input"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message Aai…"
          autoComplete="off"
          className="h-12 min-w-0 flex-1 rounded-full border border-line bg-soft px-4 text-base text-ink placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="h-12 rounded-full bg-brand px-5 font-semibold text-white hover:bg-brand-deep disabled:bg-soft disabled:text-muted"
        >
          Send
        </button>
      </form>
    </section>
  );
}

function Chips({ items, onPick, label }: { items: string[]; onPick: (s: string) => void; label: string }) {
  return (
    <ul className="flex flex-wrap gap-2 pl-10" aria-label={label}>
      {items.map((s) => (
        <li key={s}>
          <button
            type="button"
            onClick={() => onPick(s)}
            className="min-h-10 rounded-full border border-accent/40 bg-card px-3.5 py-1.5 text-left text-[15px] text-accent hover:border-accent hover:bg-mint"
          >
            {s}
          </button>
        </li>
      ))}
    </ul>
  );
}

function AssistantRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Avatar />
      <div className="min-w-0 max-w-[88%] rounded-[4px_14px_14px_14px] bg-card px-3.5 py-2.5 leading-relaxed shadow-[0_1px_2px_rgb(28_27_25/0.08)]">
        <span className="sr-only">Aai&apos;s assistant: </span>
        {children}
      </div>
    </div>
  );
}

function Message({ message }: { message: CustomerUIMessage }) {
  if (message.role === "user") {
    const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-[14px_4px_14px_14px] bg-brand px-3.5 py-2 text-white">
          <span className="sr-only">You: </span>
          {text}
        </p>
      </div>
    );
  }
  const cartParts = message.parts.filter(isCartResult);
  const lastCart = cartParts[cartParts.length - 1];

  return (
    <div className="space-y-3">
      {message.parts.map((part, i) => {
        if (part.type === "text") return part.text.trim() ? <AssistantRow key={i}><RichText text={part.text} /></AssistantRow> : null;
        if (!part.type.startsWith("tool-")) return null;
        const tp = part as ToolPart;
        if (tp.state === "input-streaming" || tp.state === "input-available") {
          return (
            <p key={i} className="flex items-center gap-2 pl-10 text-[14px] text-muted">
              <span aria-hidden="true" className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent motion-reduce:animate-none" />
              {activity(tp)}…
            </p>
          );
        }
        if (tp.state !== "output-available") return null;
        if (isCartResult(tp) && tp === lastCart) {
          const out = tp.output as CartView & { supported?: boolean };
          if (out.supported === false || out.lines.length === 0) return null;
          return (
            <div key={i} className="pl-10">
              <ChatCartCard cart={out} />
            </div>
          );
        }
        if (tp.type === "tool-create_checkout") {
          const out = tp.output;
          if (!out.ok) return null;
          return (
            <div key={i} className="pl-10">
              <div className="rounded-[10px] border border-line bg-card p-3">
                <p className="mb-2 font-semibold">Order {out.orderNumber} is ready to pay</p>
                <PayPalCheckout orderId={out.orderId} orderNumber={out.orderNumber} paypalOrderId={out.paypalOrderId} totalCents={out.totalCents} />
              </div>
            </div>
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
