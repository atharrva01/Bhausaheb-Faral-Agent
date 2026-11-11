"use client";

import { OPEN_CHAT_EVENT } from "@/components/chat/events";

export function OpenChatButton({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <button className={className} onClick={() => window.dispatchEvent(new Event(OPEN_CHAT_EVENT))}>
      {children}
    </button>
  );
}
