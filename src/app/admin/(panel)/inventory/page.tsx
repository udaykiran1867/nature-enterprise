import type { Metadata } from "next";
import Link from "next/link";
import { History, Search } from "lucide-react";
import { StockEditor } from "@/components/admin/StockEditor";
import { Pagination } from "@/components/shell/Pagination";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime, formatINR, packLabel } from "@/lib/formatting";
import { stockState, type StockState } from "@/lib/orders";
import { packSizeInBase } from "@/lib/products";
import type { Variant } from "@/types";

export const metadata: Metadata = { title: "Inventory" };
const PAGE_SIZE = 20;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const BADGE: Record<StockState, [string, string]> = { in: ["badge-green", "In Stock"], low: ["badge-amber", "Low Stock"], out: ["badge-gray", "Out of Stock"] };
const REASON: Record<string, string> = { order: "Customer order", order_cancelled: "Order cancelled", order_deleted: "Order deleted", restock: "New stock", correction: "Correction", damaged: "Damaged / expired", other: "Other" };

type Row = Variant & { sku: string | null; updated_at: string; product: { name: string } | null };

export default async function InventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const q = one(sp.q).trim().toLowerCase().slice(0, 60);
  const status = one(sp.status);
  const wanted = Math.max(1, parseInt(one(sp.page)) || 1);

  const [{ data }, { data: moves }] = await Promise.all([
    supabase.from("product_variants").select("id,pack_size,unit,sku,price,stock_quantity,low_stock_threshold,is_available,updated_at,product:products(name)"),
    supabase.from("inventory_movements").select("id,product_name,pack_label,change,reason,note,created_at").order("created_at", { ascending: false }).limit(10),
  ]);

  let rows = ((data ?? []) as unknown as Row[]).sort((a, b) => (a.product?.name ?? "").localeCompare(b.product?.name ?? "") || packSizeInBase(a) - packSizeInBase(b));
  const all = rows;
  if (q) rows = rows.filter((r) => (r.product?.name ?? "").toLowerCase().includes(q) || (r.sku ?? "").toLowerCase().includes(q));
  if (status === "low" || status === "out" || status === "in") rows = rows.filter((r) => stockState(r.stock_quantity, r.low_stock_threshold) === status);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(wanted, pages);
  const view = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const count = (s: StockState) => all.filter((r) => stockState(r.stock_quantity, r.low_stock_threshold) === s).length;
  const link = (p: number) => `/admin/inventory?${new URLSearchParams({ ...(q && { q }), ...(status && { status }), ...(p > 1 && { page: String(p) }) })}`;
  const tabs = [["", "All", all.length], ["in", "In stock", count("in")], ["low", "Low stock", count("low")], ["out", "Out of stock", count("out")]] as const;

  return (
    <div className="space-y-6">
      <div><h1 className="text-4xl">Inventory</h1><p className="text-muted-foreground">Stock for every pack size. Changes are logged and show on the store straight away.</p></div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Stock filter">
        {tabs.map(([key, label, n]) => (
          <Link key={label} href={`/admin/inventory?${new URLSearchParams({ ...(q && { q }), ...(key && { status: key }) })}`} role="tab" aria-selected={status === key}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${status === key ? "border-forest bg-forest text-ivory" : "border-border bg-card hover:bg-secondary"}`}>
            {label} <span className="opacity-70">{n}</span>
          </Link>
        ))}
      </div>

      <form role="search" className="card flex gap-3 p-3">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Search by product or SKU" aria-label="Search inventory" className="field pl-9" />
        </div>
        <button className="btn btn-outline">Search</button>
      </form>

      {view.length ? (
        <ul className="space-y-2">
          {view.map((r) => {
            const st = stockState(r.stock_quantity, r.low_stock_threshold);
            const label = `${r.product?.name ?? "Product"}, ${packLabel(r.pack_size, r.unit)}`;
            return (
              <li key={r.id} className="card grid items-center gap-x-4 gap-y-2 p-3 sm:grid-cols-[1fr_6rem_6rem_9rem_auto] sm:p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{r.product?.name ?? "Unknown product"}</p>
                  <p className="text-sm text-muted-foreground">{packLabel(r.pack_size, r.unit)}{r.sku ? ` · SKU ${r.sku}` : ""}</p>
                </div>
                <p className="text-sm font-medium">{formatINR(Number(r.price))}</p>
                <p className="text-2xl font-semibold text-forest-dark">{r.stock_quantity}<span className="ml-1 text-xs font-normal text-muted-foreground">in stock</span></p>
                <div><span className={`badge ${BADGE[st][0]}`}>{BADGE[st][1]}</span><p className="mt-1 text-xs text-muted-foreground">Updated {formatDateTime(r.updated_at)}</p></div>
                <StockEditor variantId={r.id} label={label} current={r.stock_quantity} />
              </li>
            );
          })}
        </ul>
      ) : <div className="card p-12 text-center text-muted-foreground">{all.length ? "No pack sizes match this filter." : "No products yet. Add a product to start tracking stock."}</div>}

      <Pagination page={page} pages={pages} total={rows.length} pageSize={PAGE_SIZE} noun="pack sizes" hrefFor={link} />

      <section className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4"><History className="size-4 text-forest" aria-hidden /><h2 className="font-sans text-base font-semibold">Recent stock changes <span className="font-normal text-muted-foreground">(last 10)</span></h2></div>
        {moves?.length ? (
          <ul className="divide-y divide-border text-sm">
            {moves.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3">
                <span className={`w-12 font-semibold ${m.change > 0 ? "text-forest" : "text-terracotta"}`}>{m.change > 0 ? "+" : ""}{m.change}</span>
                <span className="flex-1">{m.product_name} <span className="text-muted-foreground">· {m.pack_label}</span></span>
                <span className="text-muted-foreground">{REASON[m.reason] ?? m.reason}{m.note ? ` · ${m.note}` : ""}</span>
                <time className="text-muted-foreground" dateTime={m.created_at}>{formatDateTime(m.created_at)}</time>
              </li>
            ))}
          </ul>
        ) : <p className="px-5 py-8 text-center text-sm text-muted-foreground">No stock changes recorded yet.</p>}
      </section>
    </div>
  );
}
