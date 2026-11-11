"use client";

import { useEffect, useState, type ReactNode } from "react";
import { formatUSD } from "@/lib/money";

export type BillLine = {
  key: string;
  qty: number;
  name: string;
  nameMr?: string;
  pack?: string;
  rateCents: number;
  amountCents: number;
};

type Props = {
  /** Printed bill number ("1027"); null shows a draft slip. */
  number?: string | null;
  date?: string;
  lines: BillLine[];
  postage?: { label: string; cents: number | null; free?: boolean } | null;
  totalCents?: number | null;
  /** Show − n + in the qty column. */
  onQtyChange?: (key: string, qty: number) => void;
  maxQty?: (key: string) => number;
  busy?: boolean;
  compact?: boolean;
  /** Print the shop letterhead (default: not on compact strips). */
  letterhead?: boolean;
  /** Absolutely positioned over the slip (the shop stamp). */
  stamp?: ReactNode;
  emptyText?: string;
  children?: ReactNode;
  className?: string;
  animateIn?: boolean;
  label?: string;
};

/**
 * The पावती (bill-book slip): the one signature object of the design (docs/design/plan.md §1).
 * Used for the running bill, checkout, order receipt and chat tool results.
 */
export function Bill({
  number,
  date,
  lines,
  postage,
  totalCents,
  onQtyChange,
  maxQty,
  busy,
  compact,
  letterhead,
  stamp,
  emptyText,
  children,
  className = "",
  animateIn,
  label = "Bill",
}: Props) {
  // Rows only "ink-dry" for changes after the first render, never on page load.
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setArmed(true), 50);
    return () => clearTimeout(t);
  }, []);

  const pad = compact ? "px-3" : "px-5";
  const showHead = letterhead ?? !compact;
  return (
    <div className={`slip-wrap relative ${animateIn ? "anim-slip-out" : ""} ${className}`}>
      <section className={`slip relative ${compact ? "pb-3" : "pb-5"}`} aria-label={label}>
        {/* Letterhead, printed in khata red. Compact strips (chat copies) skip it: the running bill carries it. */}
        {showHead && (
        <header className={`${pad} flex items-start justify-between gap-3 border-b-2 border-khata pb-2`}>
          <div className="min-w-0">
            <p lang="mr" className={`type-sign leading-none text-khata ${compact ? "text-lg" : "text-xl"}`}>
              भाऊसाहेब जनरल किराणा स्टोर्स
            </p>
            {!compact && <p className="mt-1 text-sm leading-tight text-pencil">Opposite the bus depot, Karjat, Raigad</p>}
          </div>
          <div className="shrink-0 text-right leading-tight">
            <p className="text-sm text-pencil">
              <span lang="mr" className="mr">बिल नं.</span>{" "}
              <span className="num font-semibold text-khata">{number ?? "draft"}</span>
            </p>
            {date && <p className="num text-sm text-pencil">{date}</p>}
          </div>
        </header>
        )}
        {!showHead && number && (
          <p className={`${pad} border-b-2 border-khata pb-1.5 text-sm text-pencil`}>
            <span lang="mr" className="mr">बिल नं.</span> <span className="num font-semibold text-khata">{number}</span>
          </p>
        )}

        {lines.length === 0 ? (
          <p className={`${pad} py-6 text-pencil`}>{emptyText ?? "Nothing on the bill yet."}</p>
        ) : (
          <table className={`w-full border-collapse ${compact ? "text-[15px]" : "text-base"}`}>
            <thead>
              <tr className="text-left text-pencil">
                <Th className={`${pad} w-[1%] whitespace-nowrap pr-2`} mr="नग" en="Quantity" />
                <Th className="pr-2" mr="माल" en="Item" />
                {!compact && <Th className="w-[1%] pr-3 text-right" mr="दर" en="Rate" />}
                <Th className={`${pad} w-[1%] pl-0 text-right`} mr="रक्कम" en="Amount" />
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr
                  key={`${l.key}-${l.qty}`}
                  className={`border-b border-rule-paper align-top ${armed ? "anim-ink-dry" : ""}`}
                >
                  <td className={`${pad} num whitespace-nowrap py-2 pr-2 font-semibold`}>
                    {onQtyChange ? (
                      <span className="inline-flex items-center gap-1">
                        <QtyButton label={`One packet less ${l.name}`} disabled={busy} onClick={() => onQtyChange(l.key, l.qty - 1)}>
                          −
                        </QtyButton>
                        <span className="w-5 text-center">{l.qty}</span>
                        <QtyButton
                          label={`One more packet ${l.name}`}
                          disabled={busy || (maxQty ? l.qty >= maxQty(l.key) : false)}
                          onClick={() => onQtyChange(l.key, l.qty + 1)}
                        >
                          +
                        </QtyButton>
                      </span>
                    ) : (
                      l.qty
                    )}
                  </td>
                  <td className="py-2 pr-2 leading-snug">
                    <span className="font-medium">{l.name}</span>
                    {l.nameMr && (
                      <span lang="mr" className="mr ml-1.5 text-pencil">
                        {l.nameMr}
                      </span>
                    )}
                    {l.pack && <span className="block text-sm text-pencil">{l.pack} packet</span>}
                  </td>
                  {!compact && <td className="num whitespace-nowrap py-2 pr-3 text-right text-pencil">{formatUSD(l.rateCents)}</td>}
                  <td className={`${pad} num whitespace-nowrap py-2 pl-0 text-right`}>{formatUSD(l.amountCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {lines.length > 0 && (postage || totalCents != null) && (
          <dl className={`${pad} mt-2 space-y-1`}>
            {postage && (
              <div className="flex justify-between gap-3 text-pencil">
                <dt>{postage.label}</dt>
                <dd className="num whitespace-nowrap">
                  {postage.cents == null ? "after country" : postage.free ? "on us" : formatUSD(postage.cents)}
                </dd>
              </div>
            )}
            {totalCents != null && (
              <div className={`flex items-baseline justify-between gap-3 border-t-2 border-double border-ink pt-1.5 ${compact ? "text-lg" : "text-xl"}`}>
                <dt className="type-head">Total</dt>
                <dd className="num font-bold">{formatUSD(totalCents)}</dd>
              </div>
            )}
          </dl>
        )}

        {children && <div className={`${pad} mt-4`}>{children}</div>}

        {/* The signature space at the foot of the bill, where the shop presses its stamp. */}
        {stamp && (
          <div className={`${pad} relative mt-1 flex h-[118px] items-end justify-end`}>
            <div className="pointer-events-none absolute -top-5 left-3 opacity-95 sm:left-1/3">{stamp}</div>
            <p className="border-t border-pencil pt-1 text-sm text-pencil">
              <span lang="mr" className="mr">सही</span>, for Bhausaheb Kirana
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function Th({ mr, en, className = "" }: { mr: string; en: string; className?: string }) {
  return (
    <th scope="col" className={`py-1.5 text-sm font-normal ${className}`}>
      <span lang="mr" className="mr" aria-hidden="true">
        {mr}
      </span>
      <span className="sr-only">{en}</span>
    </th>
  );
}

function QtyButton({ children, label, onClick, disabled }: { children: ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-[3px] border border-pencil text-lg leading-none text-ink hover:bg-wall disabled:opacity-35"
    >
      {children}
    </button>
  );
}
