"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import type { CustomerUIMessage } from "@/app/api/chat/route";
import type { CartView } from "@/lib/ai/customer-tools";
import { useCart } from "@/components/shop/CartProvider";
import { PayPalCheckout } from "@/components/checkout/PayPalCheckout";
import { CartCard, RichText } from "@/components/chat/ChatCards";

export const OPEN_CHAT_EVENT = "bf:open-chat";

const SUGGESTIONS = [
  "2 chakli and 1 kilo besan ladoo to New Jersey",
  "1 kilo ladoo aur 2 packet chivda Dubai bhejna hai",
  "What's not spicy? Anything without dairy?",
];

const TOOL_LABEL: Record<string, string> = {
  "tool-update_cart": "Updating your cart…",
  "tool-get_cart": "Checking your cart…",
  "tool-quote_shipping": "Calculating shipping…",
  "tool-create_checkout": "Creating your PayPal payment…",
  "tool-get_product": "Looking up the details…",
  "tool-get_order_status": "Finding your order…",
};

type Part = CustomerUIMessage["parts"][number];

export function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const pathname = usePathname();
  const { cart, refresh } = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error, regenerate, clearError } = useChat<CustomerUIMessage>({
    // The agent edits the same server cart as the shop page: re-sync product cards + nav after each reply.
    onFinish: () => void refresh(),
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_CHAT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, onOpen);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status, open]);

  // The chat is for shopping; hide it on owner pages.
  if (pathname.startsWith("/owner")) return null;

  function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    if (error) clearError();
    void sendMessage({ text: t });
    setInput("");
  }

  const cartBarVisible = (cart?.itemCount ?? 0) > 0 && pathname !== "/checkout";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`fixed right-4 z-40 flex items-center gap-2 rounded-full bg-saffron px-4 py-3 font-semibold text-white shadow-lg transition hover:brightness-105 sm:bottom-6 ${
          cartBarVisible ? "bottom-24" : "bottom-5"
        }`}
      >
        <ChatIcon />
        <span>Order with Aai&apos;s assistant</span>
      </button>
    );
  }

  return (
    <section
      className="fixed inset-0 z-50 flex flex-col bg-cream sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(680px,calc(100vh-6rem))] sm:w-[400px] sm:overflow-hidden sm:rounded-2xl sm:border sm:border-line sm:shadow-2xl"
      aria-label="Chat with Aai's assistant"
      data-chat-status={status}
    >
      <header className="flex items-center justify-between bg-maroon px-4 py-3 text-cream">
        <div>
          <p className="font-display text-lg leading-tight">Aai&apos;s assistant</p>
          <p className="text-xs text-cream/80">Order in English, Hinglish or Marathi</p>
        </div>
        <button onClick={() => setOpen(false)} className="rounded-full px-3 py-1 text-2xl leading-none hover:bg-cream/10" aria-label="Close chat">
          ×
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <Bubble role="assistant">
              Namaste! 🙏 Tell me what faral you&apos;d like and where to ship it. I&apos;ll build your cart and set up a PayPal payment.
            </Bubble>
            <div className="flex flex-col items-end gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-maroon/30 bg-white px-3 py-1.5 text-left text-sm text-maroon hover:bg-cream-deep"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <Message key={m.id} message={m} />
        ))}

        {status === "submitted" && <Typing />}

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
        className="flex gap-2 border-t border-line bg-white p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={busy ? "Aai's assistant is replying…" : "e.g. 2 chakli to Toronto"}
          className="min-w-0 flex-1 rounded-full border border-line bg-cream px-4 py-2.5 outline-none focus:border-saffron"
          aria-label="Message"
          autoFocus
        />
        <button
          disabled={busy || !input.trim()}
          className="rounded-full bg-maroon px-4 font-semibold text-cream disabled:opacity-40"
          aria-label="Send"
        >
          Send
        </button>
      </form>
    </section>
  );
}

function Message({ message }: { message: CustomerUIMessage }) {
  if (message.role === "user") {
    const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
    return <Bubble role="user">{text}</Bubble>;
  }

  // Several cart tools can run in one reply (update_cart then quote_shipping): show only the latest cart card.
  const cartParts = message.parts.filter(isCartPart);
  const lastCart = cartParts[cartParts.length - 1];

  return (
    <div className="space-y-2">
      {message.parts.map((part, i) => {
        if (part.type === "text") return part.text.trim() ? <Bubble key={i} role="assistant"><RichText text={part.text} /></Bubble> : null;
        if (!part.type.startsWith("tool-")) return null;
        const tp = part as Extract<Part, { type: `tool-${string}` }>;

        if (tp.state === "input-streaming" || tp.state === "input-available") {
          return <ToolChip key={i} label={TOOL_LABEL[tp.type] ?? "Working…"} />;
        }
        if (tp.state === "output-error") return null;
        if (tp.state !== "output-available") return null;

        if (isCartPart(tp) && tp === lastCart) {
          const out = tp.output as CartView & { supported?: boolean };
          if (out.supported === false) return null;
          return <CartCard key={i} cart={out} />;
        }
        if (tp.type === "tool-create_checkout") {
          const out = tp.output;
          if (!out.ok) return null;
          return (
            <PayPalCheckout
              key={i}
              orderId={out.orderId}
              orderNumber={out.orderNumber}
              paypalOrderId={out.paypalOrderId}
              totalCents={out.totalCents}
            />
          );
        }
        return null;
      })}
    </div>
  );
}

function isCartPart(p: Part) {
  return (
    (p.type === "tool-update_cart" || p.type === "tool-get_cart" || p.type === "tool-quote_shipping") &&
    "state" in p &&
    p.state === "output-available"
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug ${
          role === "user" ? "rounded-br-sm bg-maroon text-cream" : "rounded-bl-sm border border-line bg-white"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function ToolChip({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted">
      <span className="h-2 w-2 animate-pulse rounded-full bg-saffron" />
      {label}
    </div>
  );
}

function Typing() {
  return (
    <div className="flex justify-start">
      <div className="flex gap-1 rounded-2xl rounded-bl-sm border border-line bg-white px-4 py-3" aria-label="Assistant is typing">
        {[0, 150, 300].map((d) => (
          <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-muted/60" style={{ animationDelay: `${d}ms` }} />
        ))}
      </div>
    </div>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" strokeLinejoin="round" />
    </svg>
  );
}
