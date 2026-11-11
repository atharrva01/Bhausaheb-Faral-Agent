import type { Metadata } from "next";
import { Anek_Devanagari, Tiro_Devanagari_Marathi } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

// Anek Devanagari: one family, two jobs via the width axis (signboard condensed, bill print normal).
const anek = Anek_Devanagari({
  variable: "--font-anek",
  subsets: ["latin", "devanagari"],
  axes: ["wdth"],
  display: "swap",
});

// Tiro Devanagari Marathi: Marathi letterforms (ल, श) for Marathi words only.
const tiroMr = Tiro_Devanagari_Marathi({
  variable: "--font-tiro-mr",
  subsets: ["latin", "devanagari"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const description = "Aai's Diwali faral from Bhausaheb Kirana, Karjat. Fried, rolled and packed by hand, posted to the US, UK, Canada, UAE and Australia.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "Bhausaheb Faral",
  description,
  openGraph: { title: "Bhausaheb Faral, Karjat", description, type: "website", siteName: "Bhausaheb Faral" },
  twitter: { card: "summary", title: "Bhausaheb Faral", description },
};

export const viewport = { themeColor: "#9a1c23" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${anek.variable} ${tiroMr.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
