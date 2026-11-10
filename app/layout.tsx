import type { Metadata } from "next";
import { Mukta, Rozha_One } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SiteNav } from "@/components/layout/SiteNav";
import { ChatPanel } from "@/components/chat/ChatPanel";

// Both fonts cover Latin + Devanagari, so Marathi names render properly.
const mukta = Mukta({
  variable: "--font-mukta",
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"],
});

const rozha = Rozha_One({
  variable: "--font-rozha",
  subsets: ["latin", "devanagari"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Bhausaheb Faral",
  description: "Homemade Diwali faral from Karjat, delivered to your doorstep abroad.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${mukta.variable} ${rozha.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <SiteNav />
          {children}
          <ChatPanel />
        </Providers>
      </body>
    </html>
  );
}
