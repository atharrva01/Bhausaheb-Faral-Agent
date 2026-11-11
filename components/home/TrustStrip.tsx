const POINTS = [
  { t: "Fried after you pay", d: "Aai makes each batch fresh. Nothing sits on a shelf." },
  { t: "Posted by India Post", d: "Speed post in airtight dabbas, tracking number by email." },
  { t: "Pay safely with PayPal", d: "Pay in US dollars. The shop never sees your card." },
  { t: "Free postage over $100", d: "Fill the bill past $100 and the postage is on us." },
];

export function TrustStrip() {
  return (
    <section aria-label="Why order from us" className="grid grid-cols-1 gap-px overflow-hidden rounded-[12px] border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
      {POINTS.map((p) => (
        <div key={p.t} className="bg-card p-4">
          <p className="font-semibold text-ink">{p.t}</p>
          <p className="mt-0.5 text-[15px] leading-snug text-muted">{p.d}</p>
        </div>
      ))}
    </section>
  );
}
