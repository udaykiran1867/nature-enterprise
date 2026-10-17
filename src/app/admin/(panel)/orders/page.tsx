import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Search } from "lucide-react";
import { DeleteOrderButton } from "@/components/admin/DeleteOrderButton";
import { ReleaseStaleButton } from "@/components/admin/ReleaseStaleButton";
import { Pagination } from "@/components/shell/Pagination";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatINR } from "@/lib/formatting";
import { ORDER_STATUSES, STATUS_BADGE, STATUS_LABEL, isOrderStatus } from "@/lib/orders";

export const metadata: Metadata = { title: "Orders" };
const PAGE_SIZE = 25;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const q = one(sp.q).replace(/[^A-Za-z0-9 -]/g, "").trim().slice(0, 40);
  const status = isOrderStatus(one(sp.status)) ? one(sp.status) : "";
  const from = DATE.test(one(sp.from)) ? one(sp.from) : "";
  const to = DATE.test(one(sp.to)) ? one(sp.to) : "";
  const wanted = Math.max(1, parseInt(one(sp.page)) || 1);

  let query = supabase
    .from("orders")
    .select("id,order_number,customer_name,customer_phone,total,order_status,whatsapp_handoff_status,created_at,items:order_items(count)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((wanted - 1) * PAGE_SIZE, wanted * PAGE_SIZE - 1);
  if (q) query = query.or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%`);
  if (status) query = query.eq("order_status", status);
  if (from) query = query.gte("created_at", `${from}T00:00:00+05:30`);
  if (to) query = query.lte("created_at", `${to}T23:59:59+05:30`);

  const { data, count, error } = await query;
  const rows = (data ?? []) as unknown as { id: string; order_number: string; customer_name: string; customer_phone: string; total: number; order_status: string; whatsapp_handoff_status: string; created_at: string; items: { count: number }[] }[];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(wanted, pages);
  const keep = { ...(q && { q }), ...(status && { status }), ...(from && { from }), ...(to && { to }) };
  const hrefFor = (p: number) => `/admin/orders?${new URLSearchParams({ ...keep, ...(p > 1 && { page: String(p) }) })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-4xl">Orders</h1><p className="text-muted-foreground">{total} order{total === 1 ? "" : "s"}</p></div>
        <ReleaseStaleButton />
      </div>

      <div className="flex flex-wrap gap-2">
        {[["", "All"], ...ORDER_STATUSES.map((s) => [s, STATUS_LABEL[s]])].map(([key, label]) => (
          <Link key={key || "all"} href={`/admin/orders?${new URLSearchParams({ ...(q && { q }), ...(key && { status: key }), ...(from && { from }), ...(to && { to }) })}`}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${status === key ? "border-forest bg-forest text-ivory" : "border-border bg-card hover:bg-secondary"}`}>{label}</Link>
        ))}
      </div>

      <form role="search" className="card grid gap-3 p-3 md:grid-cols-[1fr_auto_auto_auto]">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Order number, name or phone" aria-label="Search orders" className="field pl-9" />
        </div>
        <input type="date" name="from" defaultValue={from} aria-label="From date" className="field" />
        <input type="date" name="to" defaultValue={to} aria-label="To date" className="field" />
        <button className="btn btn-outline">Filter</button>
      </form>

      {error ? <div className="card p-10 text-center text-destructive">Couldn&apos;t load orders. Please refresh.</div> : rows.length ? (
        <ul className="space-y-2">
          {rows.map((o) => {
            const s = isOrderStatus(o.order_status) ? o.order_status : "submitted";
            return (
              <li key={o.id} className="card flex items-stretch overflow-hidden transition-shadow hover:shadow-md">
                <Link href={`/admin/orders/${o.id}`} className="grid flex-1 items-center gap-x-4 gap-y-1 p-4 sm:grid-cols-[8rem_1fr_6rem_8rem_auto]">
                  <span className="font-semibold text-forest-dark">{o.order_number}</span>
                  <span className="min-w-0"><span className="block truncate font-medium">{o.customer_name}</span><span className="text-sm text-muted-foreground">{o.customer_phone} · {o.items[0]?.count ?? 0} item{(o.items[0]?.count ?? 0) === 1 ? "" : "s"}</span></span>
                  <span className="font-semibold">{formatINR(Number(o.total))}</span>
                  <span className="text-sm text-muted-foreground">{formatDate(o.created_at)}</span>
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`badge ${STATUS_BADGE[s]}`}>{STATUS_LABEL[s]}</span>
                    {o.whatsapp_handoff_status === "received" && <span className="badge badge-green"><MessageCircle className="mr-1 size-3" aria-hidden />WhatsApp</span>}
                  </span>
                </Link>
                <div className="flex items-center border-l border-border px-2"><DeleteOrderButton id={o.id} number={o.order_number} /></div>
              </li>
            );
          })}
        </ul>
      ) : <div className="card p-12 text-center text-muted-foreground">{q || status || from || to ? "No orders match these filters." : "No orders yet. They'll appear here as customers submit them."}</div>}

      <Pagination page={page} pages={pages} total={total} pageSize={PAGE_SIZE} noun="orders" hrefFor={hrefFor} />
    </div>
  );
}
