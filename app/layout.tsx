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

const description = "Homemade Diwali faral from Karjat, delivered to your doorstep abroad. Order by chatting, pay in USD with PayPal.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "Bhausaheb Faral",
  description,
  openGraph: { title: "Bhausaheb Faral · Homemade Diwali faral", description, type: "website", siteName: "Bhausaheb Faral" },
  twitter: { card: "summary", title: "Bhausaheb Faral", description },
};

export const viewport = { themeColor: "#5a1520" };

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
