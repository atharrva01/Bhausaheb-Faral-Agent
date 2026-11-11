"use client";

import { useCallback, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type ICellRendererParams,
  type CellClickedEvent,
} from "ag-grid-community";
import { KpiTiles } from "@/components/owner/KpiTiles";
import { SummaryCard } from "@/components/owner/SummaryCard";
import { formatUSD } from "@/lib/money";
import type { Kpis } from "@/lib/owner/stats";
import type { OrderRow } from "@/lib/owner/orders";

ModuleRegistry.registerModules([AllCommunityModule]);

type GridContext = { changeStatus: (row: OrderRow, f: (typeof FULFILMENT)[number]) => void };

const gridTheme = themeQuartz.withParams({
  accentColor: "#e8772e",
  borderColor: "#ead8b8",
  headerBackgroundColor: "#f7e8cc",
  headerTextColor: "#5a1520",
  rowHoverColor: "#fdf6e9",
  selectedRowBackgroundColor: "#fbe7d3",
  fontFamily: "inherit",
  fontSize: 14,
  wrapperBorderRadius: 16,
  headerFontWeight: 600,
});

const FULFILMENT = ["NEW", "PACKING", "SHIPPED", "DELIVERED"] as const;
const FULFILMENT_LABEL: Record<string, string> = { NEW: "New", PACKING: "Packing", SHIPPED: "Shipped", DELIVERED: "Delivered" };
const PAYMENT_STYLE: Record<string, { label: string; cls: string }> = {
  PAID: { label: "Paid", cls: "bg-leaf/15 text-leaf" },
  AWAITING_PAYMENT: { label: "Awaiting", cls: "bg-turmeric/30 text-ink" },
  CANCELLED: { label: "Cancelled", cls: "bg-ink/10 text-muted" },
  REFUNDED: { label: "Refunded", cls: "bg-ink/70 text-white" },
};
const FULFIL_STYLE: Record<string, string> = {
  NEW: "bg-saffron/15 text-saffron",
  PACKING: "bg-turmeric/30 text-ink",
  SHIPPED: "bg-sky-100 text-sky-800",
  DELIVERED: "bg-leaf/15 text-leaf",
};

const istDate = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

function Pill({ text, cls }: { text: string; cls: string }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold leading-5 ${cls}`}>{text}</span>;
}

export function OwnerDashboard({ initialRows, initialKpis }: { initialRows: OrderRow[]; initialKpis: Kpis }) {
  const [rows, setRows] = useState(initialRows);
  const [kpis, setKpis] = useState(initialKpis);
  const [search, setSearch] = useState("");
  const [hideCancelled, setHideCancelled] = useState(true);
  const visibleRows = useMemo(() => (hideCancelled ? rows.filter((r) => r.paymentStatus !== "CANCELLED") : rows), [rows, hideCancelled]);
  const cancelledCount = rows.length - rows.filter((r) => r.paymentStatus !== "CANCELLED").length;
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const flash = useCallback((t: { kind: "ok" | "err"; text: string }) => {
    setToast(t);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const res = await fetch("/api/owner/orders");
    if (res.ok) {
      const json = await res.json();
      setRows(json.rows);
      setKpis(json.kpis);
    }
    setRefreshing(false);
  }, []);

  const columns = useMemo<ColDef<OrderRow>[]>(
    () => [
      { field: "numberValue", headerName: "Order", width: 115, valueFormatter: (p) => `#${p.value}`, sort: "desc" },
      {
        field: "createdAt",
        headerName: "Date (IST)",
        width: 150,
        valueFormatter: (p) => (p.value ? istDate.format(new Date(p.value)) : ""),
        filter: false,
      },
      { field: "customer", headerName: "Customer", flex: 1, minWidth: 150, tooltipField: "email" },
      { field: "country", headerName: "Country", width: 105, cellRenderer: (p: ICellRendererParams<OrderRow>) => <Pill text={p.value} cls="bg-cream-deep text-ink" /> },
      { field: "items", headerName: "Items", flex: 1.4, minWidth: 200, tooltipField: "items" },
      { field: "totalCents", headerName: "Total", width: 110, type: "rightAligned", valueFormatter: (p) => formatUSD(p.value), filter: "agNumberColumnFilter" },
      {
        field: "paymentStatus",
        headerName: "Payment",
        width: 125,
        cellRenderer: (p: ICellRendererParams<OrderRow>) => {
          const s = PAYMENT_STYLE[p.value] ?? { label: p.value, cls: "" };
          return <Pill text={s.label} cls={s.cls} />;
        },
      },
      {
        field: "fulfilment",
        headerName: "Fulfilment",
        headerTooltip: "Change status here (paid orders only)",
        width: 150,
        // Native <select> in the cell: one tap to change, uses the phone's own picker on mobile.
        cellRenderer: (p: ICellRendererParams<OrderRow>) => {
          if (!p.data) return null;
          if (p.data.paymentStatus === "CANCELLED") return <span className="text-muted">—</span>;
          if (p.data.paymentStatus !== "PAID") return <Pill text={FULFILMENT_LABEL[p.value] ?? p.value} cls={FULFIL_STYLE[p.value] ?? ""} />;
          return (
            <select
              value={p.value}
              aria-label={`Fulfilment for ${p.data.number}`}
              onChange={(e) => (p.context as GridContext).changeStatus(p.data!, e.target.value as (typeof FULFILMENT)[number])}
              onClick={(e) => e.stopPropagation()}
              className={`cursor-pointer rounded-full border-0 px-2 py-0.5 text-xs font-semibold outline-none ring-saffron focus:ring-2 ${FULFIL_STYLE[p.value] ?? ""}`}
            >
              {FULFILMENT.map((f) => (
                <option key={f} value={f}>
                  {FULFILMENT_LABEL[f]}
                </option>
              ))}
            </select>
          );
        },
      },
      { field: "source", headerName: "Via", width: 90 },
    ],
    [],
  );

  const changeStatus = useCallback(
    async (row: OrderRow, fulfilment: (typeof FULFILMENT)[number]) => {
      const previous = row.fulfilment;
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, fulfilment } : r))); // optimistic
      const res = await fetch("/api/owner/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, fulfilment }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, fulfilment: previous } : r))); // roll back
        return flash({ kind: "err", text: json.message ?? "Could not update status" });
      }
      setRows((prev) => prev.map((r) => (r.id === json.row.id ? json.row : r)));
      setKpis(json.kpis);
      flash({ kind: "ok", text: `${json.row.number} marked ${FULFILMENT_LABEL[fulfilment].toLowerCase()}` });
    },
    [flash],
  );
  const gridContext = useMemo<GridContext>(() => ({ changeStatus }), [changeStatus]);

  function onCellClicked(e: CellClickedEvent<OrderRow>) {
    if (e.column.getColId() === "fulfilment" && e.data?.paymentStatus === "PAID") return; // the select handles it // that click edits the status
    if (e.data) setSelected(e.data);
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-maroon">Namaskar, Aai 🙏</h1>
          <p className="text-sm text-muted">Here&apos;s how the faral orders are doing.</p>
        </div>
        <button onClick={refresh} disabled={refreshing} className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-semibold hover:bg-cream-deep disabled:opacity-50">
          {refreshing ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      <KpiTiles kpis={kpis} />
      <SummaryCard />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Orders</h2>
            <label className="flex items-center gap-1.5 text-sm text-muted">
              <input type="checkbox" checked={hideCancelled} onChange={(e) => setHideCancelled(e.target.checked)} className="accent-maroon" />
              Hide cancelled ({cancelledCount})
            </label>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, item, country, order #…"
            className="w-full max-w-xs rounded-full border border-line bg-white px-4 py-2 text-sm outline-none focus:border-saffron"
            aria-label="Search orders"
          />
        </div>
        <div className="h-[560px] w-full">
          <AgGridReact<OrderRow>
            theme={gridTheme}
            rowData={visibleRows}
            columnDefs={columns}
            defaultColDef={{ sortable: true, filter: true, resizable: true }}
            getRowId={(p) => p.data.id}
            quickFilterText={search}
            context={gridContext}
            onCellClicked={onCellClicked}
            rowClass="cursor-pointer"
            tooltipShowDelay={400}
            animateRows
          />
        </div>
        <p className="text-xs text-muted">Tip: click a row for details. Change a paid order&apos;s status with its Fulfilment dropdown.</p>
      </section>

      {selected && <OrderDrawer order={selected} onClose={() => setSelected(null)} />}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg ${
            toast.kind === "ok" ? "bg-leaf" : "bg-red-700"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

function OrderDrawer({ order, onClose }: { order: OrderRow; onClose: () => void }) {
  const d = order.detail;
  const pay = PAYMENT_STYLE[order.paymentStatus];
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`Order ${order.number}`}>
      <button className="absolute inset-0 bg-ink/40" aria-label="Close" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl">
        <header className="sticky top-0 flex items-start justify-between border-b border-line bg-white px-5 py-4">
          <div>
            <h2 className="font-display text-2xl text-maroon">Order {order.number}</h2>
            <p className="text-sm text-muted">{istDate.format(new Date(order.createdAt))} · via {order.source}</p>
            <div className="mt-2 flex gap-2">
              <Pill text={pay?.label ?? order.paymentStatus} cls={pay?.cls ?? ""} />
              <Pill text={FULFILMENT_LABEL[order.fulfilment]} cls={FULFIL_STYLE[order.fulfilment]} />
            </div>
          </div>
          <button onClick={onClose} className="rounded-full px-3 py-1 text-2xl leading-none text-muted hover:bg-cream-deep" aria-label="Close">
            ×
          </button>
        </header>

        <div className="space-y-5 px-5 py-4 text-sm">
          <section>
            <h3 className="mb-2 font-semibold">Items</h3>
            <ul className="divide-y divide-line rounded-xl border border-line">
              {d.lines.map((l, i) => (
                <li key={i} className="flex justify-between px-3 py-2">
                  <span>
                    {l.name} <span className="text-muted">({l.packSize}) × {l.quantity}</span>
                  </span>
                  <span className="tabular-nums">{formatUSD(l.unitCents * l.quantity)}</span>
                </li>
              ))}
              <li className="flex justify-between px-3 py-2 text-muted">
                <span>Shipping</span>
                <span className="tabular-nums">{order.shippingCents === 0 ? "FREE" : formatUSD(order.shippingCents)}</span>
              </li>
              <li className="flex justify-between px-3 py-2 font-bold text-maroon">
                <span>Total</span>
                <span className="tabular-nums">{formatUSD(order.totalCents)}</span>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="mb-1 font-semibold">Ship to</h3>
            <p className="whitespace-pre-line">{d.address}</p>
            <p className="mt-1 text-muted">{order.email}</p>
          </section>

          {d.giftMessage && (
            <section>
              <h3 className="mb-1 font-semibold">Gift message</h3>
              <p className="rounded-lg bg-cream p-2 italic">“{d.giftMessage}”</p>
            </section>
          )}

          <section>
            <h3 className="mb-1 font-semibold">Shipping & PayPal</h3>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="text-muted">Tracking</dt>
              <dd>{d.trackingNumber ? `${d.carrier ?? ""} ${d.trackingNumber}` : "—"}</dd>
              <dt className="text-muted">PayPal order</dt>
              <dd className="break-all font-mono text-xs">{d.paypalOrderId ?? "— (demo data)"}</dd>
              <dt className="text-muted">Capture</dt>
              <dd className="break-all font-mono text-xs">{d.paypalCaptureId ?? "—"}</dd>
              {d.paypalInvoiceId && (
                <>
                  <dt className="text-muted">Invoice</dt>
                  <dd className="break-all font-mono text-xs">{d.paypalInvoiceId}</dd>
                </>
              )}
            </dl>
          </section>

          <section>
            <h3 className="mb-2 font-semibold">Timeline</h3>
            <ol className="space-y-2 border-l-2 border-line pl-4">
              {d.events.map((e, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-saffron" />
                  <p>{e.message}</p>
                  <p className="text-xs text-muted">{istDate.format(new Date(e.createdAt))}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </aside>
    </div>
  );
}
