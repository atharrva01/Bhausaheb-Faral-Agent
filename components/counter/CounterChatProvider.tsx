"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Chat, useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { CustomerUIMessage } from "@/app/api/chat/route";
import { useCart } from "@/components/shop/CartProvider";

const ChatContext = createContext<Chat<CustomerUIMessage> | null>(null);

/** One conversation per visit, shared by every page, so leaving the counter for checkout keeps the chat. */
export function CounterChatProvider({ children }: { children: React.ReactNode }) {
  const { refresh } = useCart();
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  const [chat] = useState(
    () =>
      new Chat<CustomerUIMessage>({
        transport: new DefaultChatTransport({ api: "/api/chat" }),
        // The agent edits the same server cart as the rate board: re-sync the bill after each reply.
        onFinish: () => void refreshRef.current(),
      }),
  );
  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
}

export function useCounterChat() {
  const chat = useContext(ChatContext);
  if (!chat) throw new Error("useCounterChat must be used inside <CounterChatProvider>");
  return useChat<CustomerUIMessage>({ chat });
}
