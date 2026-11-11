"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, themeQuartz, type CellClickedEvent, type ColDef, type ICellRendererParams } from "ag-grid-community";
import { SummaryCard } from "@/components/owner/SummaryCard";
import { useOwnerLang } from "@/components/owner/OwnerLang";
import { Bill } from "@/components/bill/Bill";
import { ShopStamp } from "@/components/bill/ShopStamp";
import { formatUSD } from "@/lib/money";
import { SHIPPING_RATES, isSupportedCountry } from "@/lib/shipping";
import type { OrderRow } from "@/lib/owner/orders";
import type { OwnerDict } from "@/lib/owner/i18n";

ModuleRegistry.registerModules([AllCommunityModule]);

const FULFILMENT = ["NEW", "PACKING", "SHIPPED", "DELIVERED"] as const;
type Fulfilment = (typeof FULFILMENT)[number];
type GridContext = { changeStatus: (row: OrderRow, f: Fulfilment) => void; t: OwnerDict };

// The khata, themed to the storefront: Anek, 50px rows, ruled lines, no default Quartz look.
const khataTheme = themeQuartz.withParams({
  fontFamily: "inherit",
  fontSize: 15,
  rowHeight: 50,
  headerHeight: 44,
  backgroundColor: "#ffffff",
  foregroundColor: "#1c1b19",
  headerBackgroundColor: "#f1efe9",
  headerTextColor: "#5c5850",
  headerFontWeight: 600,
  borderColor: "#e2dfd7",
  rowBorder: { color: "#e2dfd7" },
  columnBorder: false,
  headerColumnBorder: false,
  wrapperBorder: { color: "#e2dfd7" },
  wrapperBorderRadius: 12,
  accentColor: "#17603f",
  rowHoverColor: "#f6f4ee",
  selectedRowBackgroundColor: "#e6f2ea",
  oddRowBackgroundColor: "#ffffff",
  cellHorizontalPadding: 14,
  chromeBackgroundColor: "#f1efe9",
});

// Stamp-style status labels: outlined, coloured by meaning.
const PAY_CLS: Record<string, string> = {
  PAID: "border-accent bg-mint text-accent",
  AWAITING_PAYMENT: "border-danger text-danger",
  CANCELLED: "border-line text-muted",
  REFUNDED: "border-muted text-muted",
};
const PARCEL_CLS: Record<string, string> = {
  NEW: "border-ink/40 bg-card text-ink",
  PACKING: "border-cta bg-cta text-ink",
  SHIPPED: "border-accent bg-card text-accent",
  DELIVERED: "border-accent bg-accent text-white",
};

const dateFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const dayFmt = (lang: string) =>
  new Intl.DateTimeFormat(lang === "mr" ? "mr-IN" : "en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long" });

function Label({ text, cls }: { text: string; cls: string }) {
  return <span className={`inline-flex h-6 items-center rounded-[3px] border px-2 text-[13px] font-semibold leading-none ${cls}`}>{text}</span>;
}

type Props = {
  initialRows: OrderRow[];
  week: { revenueCents: number; paidOrders: number };
  lowStock: { name: string; nameMarathi: string; stock: number }[];
};

export function OwnerDashboard({ initialRows, week, lowStock }: Props) {
  const { lang, t } = useOwnerLang();
  const [rows, setRows] = useState(initialRows);
  const [search, setSearch] = useState("");
  const [showCancelled, setShowCancelled] = useState(false);
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [today, setToday] = useState("");

  // Date only on the client (avoids a server/client time-zone mismatch).
  useEffect(() => {
    const id = setTimeout(() => setToday(dayFmt(lang).format(new Date())), 0);
    return () => clearTimeout(id);
  }, [lang]);

  const flash = useCallback((x: { kind: "ok" | "err"; text: string }) => {
    setToast(x);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const changeStatus = useCallback(
    async (row: OrderRow, fulfilment: Fulfilment, doneText?: string) => {
      const previous = row.fulfilment;
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, fulfilment } : r)));
      const res = await fetch("/api/owner/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, fulfilment }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, fulfilment: previous } : r)));
        return flash({ kind: "err", text: json.message ?? t.changeFailed });
      }
      setRows((prev) => prev.map((r) => (r.id === json.row.id ? json.row : r)));
      flash({ kind: "ok", text: `${json.row.number}: ${doneText ?? t.parcel[fulfilment]}` });
    },
    [flash, t],
  );
  const gridContext = useMemo<GridContext>(() => ({ changeStatus: (r, f) => changeStatus(r, f), t }), [changeStatus, t]);

  // What Aai needs first: everything paid and not posted yet, and the batch totals to fry.
  const toPack = useMemo(() => rows.filter((r) => r.paymentStatus === "PAID" && (r.fulfilment === "NEW" || r.fulfilment === "PACKING")), [rows]);
  const batch = useMemo(() => {
    const m = new Map<string, { name: string; mr: string; n: number }>();
    for (const r of toPack)
      for (const l of r.detail.lines) {
        const cur = m.get(l.slug) ?? { name: l.name, mr: l.nameMarathi, n: 0 };
        cur.n += l.quantity;
        m.set(l.slug, cur);
      }
    return [...m.values()].sort((a, b) => b.n - a.n);
  }, [toPack]);
  const unpaid = rows.filter((r) => r.paymentStatus === "AWAITING_PAYMENT");
  const cancelledCount = rows.filter((r) => r.paymentStatus === "CANCELLED").length;
  const visible = useMemo(() => (showCancelled ? rows : rows.filter((r) => r.paymentStatus !== "CANCELLED")), [rows, showCancelled]);

  const columns = useMemo<ColDef<OrderRow>[]>(
    () => [
      { field: "numberValue", headerName: t.colBill, width: 96, sort: "desc", cellClass: "font-semibold" },
      { field: "createdAt", headerName: t.colDate, width: 140, valueFormatter: (p) => (p.value ? dateFmt.format(new Date(p.value)) : "") },
      { field: "customer", headerName: t.colCustomer, flex: 1, minWidth: 150, tooltipField: "email" },
      { field: "country", headerName: t.colCountry, width: 96 },
      { field: "items", headerName: t.colItems, flex: 1.5, minWidth: 200, tooltipField: "items" },
      { field: "totalCents", headerName: t.colTotal, width: 104, type: "rightAligned", valueFormatter: (p) => formatUSD(p.value), cellClass: "num" },
      {
        field: "paymentStatus",
        headerName: t.colPayment,
        width: 124,
        cellRenderer: (p: ICellRendererParams<OrderRow>) => <Label text={(p.context as GridContext).t.pay[p.value] ?? p.value} cls={PAY_CLS[p.value] ?? ""} />,
      },
      {
        field: "fulfilment",
        headerName: t.colParcel,
        width: 150,
        cellRenderer: (p: ICellRendererParams<OrderRow>) => {
          const ctx = p.context as GridContext;
          if (!p.data || p.data.paymentStatus === "CANCELLED") return <span className="text-muted">—</span>;
          if (p.data.paymentStatus !== "PAID") return <Label text={ctx.t.parcel[p.value]} cls={PARCEL_CLS[p.value]} />;
          return (
            <select
              value={p.value}
              aria-label={`${ctx.t.colParcel} ${p.data.number}`}
              onChange={(e) => ctx.changeStatus(p.data!, e.target.value as Fulfilment)}
              onClick={(e) => e.stopPropagation()}
              className={`h-8 cursor-pointer rounded-[3px] border px-1.5 text-[13px] font-semibold ${PARCEL_CLS[p.value]} [&>option]:bg-white [&>option]:text-ink`}
            >
              {FULFILMENT.map((f) => (
                <option key={f} value={f}>
                  {ctx.t.parcel[f]}
                </option>
              ))}
            </select>
          );
        },
      },
      { field: "source", headerName: t.colVia, width: 108, valueFormatter: (p) => t.via[p.value] ?? p.value },
    ],
    [t],
  );

  function onCellClicked(e: CellClickedEvent<OrderRow>) {
    if (e.column.getColId() === "fulfilment" && e.data?.paymentStatus === "PAID") return;
    if (e.data) setSelected(e.data);
  }

  const q = search.trim().toLowerCase();
  const cards = visible.filter((r) => !q || `${r.number} ${r.customer} ${r.email} ${r.items} ${r.country}`.toLowerCase().includes(q));

  return (
    <div className="mx-auto w-full max-w-[1320px] space-y-7 px-4 py-6 sm:px-6">
      <div>
        <h1 className="type-title min-h-[1.2em] text-[30px] leading-[1.1] sm:text-[38px]">{today}</h1>
        <p className="num mt-1 text-lg text-muted">{t.thisWeek(formatUSD(week.revenueCents), week.paidOrders)}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* To make and pack */}
        <section aria-labelledby="pack-heading" className="min-w-0 rounded-[12px] border border-line bg-card">
          <div className="border-b border-line p-4">
            <h2 id="pack-heading" className="type-head text-2xl text-accent">
              {t.makeAndPack}
            </h2>
            {batch.length > 0 && (
              <>
                <p className="mt-1 text-muted">{t.forParcels(toPack.length)}</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {batch.map((b) => (
                    <li key={b.name} className="rounded-[8px] bg-soft px-3 py-2">
                      <span className="font-semibold">{b.name}</span>{" "}
                      <span lang="mr" className="mr text-muted">
                        {b.mr}
                      </span>
                      <span className="num ml-2 font-bold text-accent">{t.packets(b.n)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          {toPack.length === 0 ? (
            <p className="p-4 text-muted">{t.nothingToPack}</p>
          ) : (
            <ul>
              {toPack.map((r) => {
                const next: Fulfilment = r.fulfilment === "NEW" ? "PACKING" : "SHIPPED";
                return (
                  <li key={r.id} className="flex flex-col gap-3 border-b border-line p-4 last:border-b-0 sm:flex-row sm:items-center">
                    <button type="button" onClick={() => setSelected(r)} className="min-w-0 flex-1 text-left" aria-label={t.openBill(r.number)}>
                      <p className="font-semibold">
                        {r.number} {r.customer}
                        <span className="ml-2 font-normal text-muted">{isSupportedCountry(r.country) ? SHIPPING_RATES[r.country].name : r.country}</span>
                      </p>
                      <p className="text-[15px] text-muted">{r.items}</p>
                    </button>
                    <div className="flex items-center gap-3">
                      <Label text={t.parcel[r.fulfilment]} cls={PARCEL_CLS[r.fulfilment]} />
                      <button
                        type="button"
                        onClick={() => changeStatus(r, next, next === "PACKING" ? t.packingStarted : t.markedPosted)}
                        className="h-12 min-w-[150px] rounded-[6px] bg-cta px-4 font-semibold text-ink hover:bg-cta-hi"
                      >
                        {next === "PACKING" ? t.startPacking : t.markPosted}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {toPack.some((r) => r.fulfilment === "PACKING") && <p className="border-t border-line px-4 py-3 text-[14px] text-muted">{t.trackingHint}</p>}
        </section>

        <div className="space-y-6">
          {/* Needs a look */}
          <section aria-labelledby="look-heading" className="rounded-[12px] border border-line bg-card p-4">
            <h2 id="look-heading" className="type-head text-xl text-accent">
              {t.needsLook}
            </h2>
            <h3 className="mt-3 font-semibold">{unpaid.length ? t.unpaid(unpaid.length) : t.allPaid}</h3>
            <ul className="mt-1 space-y-1">
              {unpaid.slice(0, 5).map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => setSelected(r)} className="flex w-full justify-between gap-3 rounded-[6px] px-2 py-1.5 text-left hover:bg-soft">
                    <span>
                      {r.number} {r.customer}
                    </span>
                    <span className="num text-danger">{formatUSD(r.totalCents)}</span>
                  </button>
                </li>
              ))}
            </ul>
            <h3 className="mt-4 font-semibold">{lowStock.length ? t.lowStock : t.stockFine}</h3>
            <ul className="mt-1 space-y-1">
              {lowStock.map((p) => (
                <li key={p.name} className="flex justify-between px-2 py-1">
                  <span>
                    {p.name}{" "}
                    <span lang="mr" className="mr text-muted">
                      {p.nameMarathi}
                    </span>
                  </span>
                  <span className={`num ${p.stock === 0 ? "text-danger" : "text-accent"}`}>{t.packetsLeft(p.stock)}</span>
                </li>
              ))}
            </ul>
          </section>
          <SummaryCard />
        </div>
      </div>

      {/* The khata */}
      <section aria-labelledby="khata-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="khata-heading" className="type-head text-2xl">
            {t.khata}
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-[15px] text-muted">
              <input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} className="h-4 w-4 accent-[#17603f]" />
              {t.showCancelled(cancelledCount)}
            </label>
            <label htmlFor="khata-search" className="sr-only">
              {t.search}
            </label>
            <input
              id="khata-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.search}
              className="h-11 w-full rounded-[8px] border border-line bg-soft px-3 text-ink placeholder:text-mutedd sm:w-80"
            />
          </div>
        </div>

        {/* Phones: cards. Tablet/desktop: the grid. */}
        <ul className="space-y-2 md:hidden">
          {cards.map((r) => (
            <li key={r.id} className="rounded-[12px] border border-line bg-card p-3">
              <button type="button" className="block w-full text-left" onClick={() => setSelected(r)} aria-label={t.openBill(r.number)}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold">
                    {r.number} {r.customer}
                  </span>
                  <span className="num font-bold text-accent">{formatUSD(r.totalCents)}</span>
                </div>
                <p className="mt-0.5 truncate text-[15px] text-muted">{r.items}</p>
              </button>
              <div className="mt-2 flex items-center gap-2">
                <Label text={t.pay[r.paymentStatus]} cls={PAY_CLS[r.paymentStatus]} />
                {r.paymentStatus === "PAID" && (
                  <select
                    value={r.fulfilment}
                    aria-label={`${t.colParcel} ${r.number}`}
                    onChange={(e) => changeStatus(r, e.target.value as Fulfilment)}
                    className={`h-9 rounded-[3px] border px-1.5 text-[13px] font-semibold ${PARCEL_CLS[r.fulfilment]} [&>option]:bg-white [&>option]:text-ink`}
                  >
                    {FULFILMENT.map((f) => (
                      <option key={f} value={f}>
                        {t.parcel[f]}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </li>
          ))}
        </ul>
        <div className="hidden h-[560px] w-full md:block">
          <AgGridReact<OrderRow>
            theme={khataTheme}
            rowData={visible}
            columnDefs={columns}
            defaultColDef={{ sortable: true, resizable: true }}
            getRowId={(p) => p.data.id}
            quickFilterText={search}
            context={gridContext}
            onCellClicked={onCellClicked}
            rowClass="cursor-pointer"
            tooltipShowDelay={400}
          />
        </div>
      </section>

      {selected && <OrderDrawer order={selected} t={t} onClose={() => setSelected(null)} />}

      {toast && (
        <div role="status" className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[8px] px-5 py-3 font-semibold shadow-[0_8px_24px_rgb(28_27_25/0.18)] ${toast.kind === "ok" ? "bg-accent text-white" : "bg-danger text-white"}`}>
          {toast.text}
        </div>
      )}
    </div>
  );
}

function OrderDrawer({ order, t, onClose }: { order: OrderRow; t: OwnerDict; onClose: () => void }) {
  const d = order.detail;
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const paidEvent = d.events.find((e) => e.type === "paid");
  const paidDay = paidEvent ? new Date(paidEvent.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }) : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={t.openBill(order.number)}>
      <button className="absolute inset-0 bg-ink/45" aria-label={t.close} tabIndex={-1} onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-[480px] flex-col overflow-y-auto border-l border-line bg-page p-4 sm:p-5">
        <div className="mb-3 flex justify-end">
          <button ref={closeRef} type="button" onClick={onClose} className="h-10 rounded-[6px] px-3 font-semibold text-accent underline underline-offset-4">
            {t.close}
          </button>
        </div>
        <Bill
          label={order.number}
          number={String(order.numberValue)}
          date={dateFmt.format(new Date(order.createdAt))}
          lines={d.lines.map((l, i) => ({
            key: `${l.slug}-${i}`,
            qty: l.quantity,
            name: l.name,
            nameMr: l.nameMarathi,
            pack: l.packSize,
            rateCents: l.unitCents,
            amountCents: l.unitCents * l.quantity,
          }))}
          postage={{ label: `Postage to ${order.country}`, cents: order.shippingCents, free: order.shippingCents === 0 }}
          totalCents={order.totalCents}
          stamp={order.paymentStatus === "PAID" ? <ShopStamp label="Paid" animate={false} size={112} sub={paidDay ? `Paid, ${paidDay}` : "Paid"} /> : undefined}
        />

        <div className="mt-6 space-y-5 text-[15px]">
          <section>
            <h3 className="type-head text-lg text-accent">{t.shipTo}</h3>
            <p className="mt-1 whitespace-pre-line">{d.address}</p>
            <p className="text-muted">{order.email}</p>
          </section>
          {d.giftMessage && (
            <section>
              <h3 className="type-head text-lg text-accent">{t.noteInside}</h3>
              <p className="mr mt-1 italic">&ldquo;{d.giftMessage}&rdquo;</p>
            </section>
          )}
          <section>
            <h3 className="type-head text-lg text-accent">{t.paypal}</h3>
            <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="text-muted">{t.tracking}</dt>
              <dd>{d.trackingNumber ? `${d.carrier ?? ""} ${d.trackingNumber}` : "—"}</dd>
              <dt className="text-muted">{t.paypalOrder}</dt>
              <dd className="break-all">{d.paypalOrderId ?? t.noPaypal}</dd>
              <dt className="text-muted">{t.paypalPayment}</dt>
              <dd className="break-all">{d.paypalCaptureId ?? "—"}</dd>
              {d.paypalInvoiceId && (
                <>
                  <dt className="text-muted">{t.paypalInvoice}</dt>
                  <dd className="break-all">{d.paypalInvoiceId}</dd>
                </>
              )}
            </dl>
          </section>
          <section>
            <h3 className="type-head text-lg text-accent">{t.history}</h3>
            <ol className="mt-2 space-y-2">
              {d.events.map((e, i) => (
                <li key={i} className="border-l-2 border-accent pl-3">
                  <p>{e.message.replace(/ \u2192 /g, " to ")}</p>
                  <p className="text-[13px] text-muted">{dateFmt.format(new Date(e.createdAt))}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </aside>
    </div>
  );
}
