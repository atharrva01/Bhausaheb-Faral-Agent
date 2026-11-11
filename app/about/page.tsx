import type { Metadata } from "next";
import Link from "next/link";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "Our story · Bhausaheb Faral",
  description: "A family kirana shop in Karjat, Aai's homemade Diwali faral, and how AI + PayPal let relatives abroad order it.",
};

export default function AboutPage() {
  return (
    <>
      <main className="flex-1">
        <header className="bg-maroon text-cream">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-turmeric sm:text-sm">Our story</p>
            <h1 className="mt-2 font-display text-3xl leading-tight sm:text-5xl">From Aai&apos;s kitchen in Karjat to your Diwali table abroad</h1>
          </div>
        </header>

        <article className="mx-auto max-w-3xl space-y-10 px-4 py-10 text-[17px] leading-relaxed">
          <section className="space-y-3">
            <p>
              <strong>Bhausaheb General Kirana Stores</strong> sits opposite the bus depot in Karjat, a small town in Raigad, Maharashtra.
              Every Diwali, Aai makes faral by hand in small batches: chakli from her own roasted bhajani, besan ladoo slow-roasted in ghee,
              karanji, shankarpali, chivda and anarse.
            </p>
            <p>
              Relatives and Marathi families in the US, UK, Canada, UAE and Australia want that taste of home. Until now every order
              meant WhatsApp calls, prices worked out by hand, and asking someone in India to pay on their behalf. Nobody could see what was
              paid, packed or shipped.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-maroon">What this app does</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-white p-5">
                <h3 className="font-semibold">For customers abroad</h3>
                <p className="mt-1 text-[15px] text-muted">
                  Chat in English, Hinglish or Marathi (&quot;1 kilo ladoo aur do packet chivda Dubai bhejna hai&quot;). The assistant builds the cart,
                  quotes international shipping and shows a PayPal button. You pay in USD.
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-white p-5">
                <h3 className="font-semibold">For Aai and the shop</h3>
                <p className="mt-1 text-[15px] text-muted">
                  One dashboard with every order, a daily summary in Marathi, and an assistant that can mark orders shipped with tracking and
                  send PayPal invoices, always after a Confirm click.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-maroon">Why you can trust the total</h2>
            <p>
              The AI only decides <em>what</em> you want: which faral, how many, where to ship. Every price, shipping cost and PayPal amount is
              calculated by our server from the shop&apos;s database. No chat message can change what you pay.
            </p>
          </section>

          <section className="space-y-3 rounded-2xl bg-cream-deep/60 p-5 text-[15px]">
            <h2 className="font-semibold">A note on shipping food abroad</h2>
            <p className="text-muted">
              International food parcels have import rules (for example US FDA prior notice, and Australian biosecurity limits on dairy and ghee).
              This is a hackathon demo running on PayPal sandbox; a real launch would handle those rules per country.
            </p>
          </section>

          <div className="flex flex-wrap gap-3">
            <OpenChatButton className="rounded-full bg-saffron px-6 py-3 font-semibold text-white hover:brightness-105">
              Order by chatting with Aai&apos;s assistant
            </OpenChatButton>
            <Link href="/" className="rounded-full border border-line px-6 py-3 font-semibold hover:bg-cream-deep">
              Browse the faral
            </Link>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
