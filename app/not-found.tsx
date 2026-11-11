import Link from "next/link";
import { Signboard } from "@/components/brand/Signboard";
import { Bill } from "@/components/bill/Bill";

export default function NotFound() {
  return (
    <>
      <Signboard slim />
      <main className="mx-auto w-full max-w-[560px] flex-1 px-4 py-12">
        <h1 className="type-title text-[30px] sm:text-[40px]">That page isn&apos;t on our shelf</h1>
        <div className="mt-6">
          <Bill
            label="Bill 404"
            number="404"
            lines={[{ key: "p", qty: 1, name: "Page, not found", rateCents: 0, amountCents: 0 }]}
            totalCents={0}
          />
        </div>
        <p className="mt-8 text-lg">
          <Link href="/" className="font-semibold text-stamp underline underline-offset-4">
            Back to today&apos;s rates
          </Link>
        </p>
      </main>
    </>
  );
}
