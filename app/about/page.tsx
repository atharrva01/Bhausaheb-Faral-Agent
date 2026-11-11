import type { Metadata } from "next";
import Link from "next/link";
import { Signboard } from "@/components/brand/Signboard";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { BillBar } from "@/components/shop/BillBar";

export const metadata: Metadata = {
  title: "Our story · Bhausaheb Faral",
  description: "A kirana shop in Karjat, Aai's Diwali faral, and how relatives abroad now order it without five phone calls.",
};

export default function AboutPage() {
  return (
    <>
      <Signboard slim />
      <main className="mx-auto w-full max-w-[680px] flex-1 px-4 pb-14 pt-9 sm:px-6">
        <h1 className="type-title text-[30px] leading-[1.1] sm:text-[40px]">Our story</h1>

        <div className="mt-6 space-y-5 text-lg leading-[1.7]">
          <p>
            Bhausaheb General Kirana Stores sits opposite the bus depot in Karjat, in Raigad district. Most of the year it sells what every kirana
            sells. Every Diwali, Aai turns the back of the house into a faral kitchen: chakli pressed from her own roasted bhajani, besan ladoo
            roasted slowly in ghee, karanji, shankarpali, chivda, and anarse when there&apos;s time.
          </p>
          <p>
            Our relatives in New Jersey, Leicester, Brampton, Dubai and Parramatta wanted that faral too. Every order meant a WhatsApp call, a price
            worked out on the spot, a cousin in Pune asked to pay on someone&apos;s behalf, and nobody quite sure what was paid, packed or posted.
          </p>

          <h2 className="type-head border-b-2 border-ink pb-2 pt-4 text-2xl">What changed</h2>
          <p>
            Now you write to the counter the way you&apos;d talk to us, in English, Hinglish or Marathi. The counter writes your bill, adds postage
            for your country, and opens PayPal so you can pay in US dollars. Aai sees a list of what to fry and pack today; Atharva marks parcels as
            posted and the tracking number goes straight onto your PayPal payment.
          </p>

          <h2 className="type-head border-b-2 border-ink pb-2 pt-4 text-2xl">Why the total can&apos;t be talked down</h2>
          <p>
            The assistant only decides what you want: which faral, how many packets, where it&apos;s going. Every rate, the postage and the amount
            PayPal charges are worked out by the shop&apos;s own system from the rate board. Asking the chat for a $1 total gets you a polite no.
          </p>

          <h2 className="type-head border-b-2 border-ink pb-2 pt-4 text-2xl">About sending food abroad</h2>
          <p className="text-pencil">
            Countries have rules about food parcels: the US asks for prior notice, and Australia is strict about dairy and ghee. This is a hackathon
            demo running on PayPal&apos;s sandbox. A real season would handle those rules country by country.
          </p>
        </div>

        <p className="mt-9 text-lg">
          <Link href="/#counter" className="font-semibold text-stamp underline underline-offset-4">
            Go to the counter and order
          </Link>
        </p>
        <p className="mt-6 text-pencil">Atharva, for Aai and the shop</p>
      </main>
      <SiteFooter />
      <BillBar />
    </>
  );
}
