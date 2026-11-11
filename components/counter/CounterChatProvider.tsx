"use client";

import { createContext, useContext, useState } from "react";
import { Chat, useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { CustomerUIMessage } from "@/app/api/chat/route";
import { CART_CHANGED_EVENT } from "@/components/shop/CartProvider";

const ChatContext = createContext<Chat<CustomerUIMessage> | null>(null);

/** One conversation per visit, shared by every page, so leaving the counter for checkout keeps the chat. */
export function CounterChatProvider({ children }: { children: React.ReactNode }) {
  const [chat] = useState(
    () =>
      new Chat<CustomerUIMessage>({
        transport: new DefaultChatTransport({ api: "/api/chat" }),
        // The agent edits the same server cart as the rate board: tell the cart to re-sync after each reply.
        onFinish: () => window.dispatchEvent(new Event(CART_CHANGED_EVENT)),
      }),
  );
  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
}

export function useCounterChat() {
  const chat = useContext(ChatContext);
  if (!chat) throw new Error("useCounterChat must be used inside <CounterChatProvider>");
  return useChat<CustomerUIMessage>({ chat });
}
