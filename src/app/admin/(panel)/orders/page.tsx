import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Search, X } from "lucide-react";
import { DeleteOrderButton } from "@/components/admin/DeleteOrderButton";
import { ReleaseStaleButton } from "@/components/admin/ReleaseStaleButton";
import { Pagination } from "@/components/shell/Pagination";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatINR } from "@/lib/formatting";
import { ORDER_STATUSES, STATUS_BADGE, STATUS_LABEL, isOrderStatus } from "@/lib/orders";
import { isPaymentMethod, paymentBadge } from "@/lib/payments";

export const metadata: Metadata = { title: "Orders" };
export const instant = false;
const PAGE_SIZE = 25;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const PAY_FILTERS: Record<string, string> = { verify: "Awaiting payment", paid: "Paid", refunded: "Refunded" };

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const q = one(sp.q).replace(/[^A-Za-z0-9 -]/g, "").trim().slice(0, 40);
  const status = isOrderStatus(one(sp.status)) ? one(sp.status) : "";
  const from = DATE.test(one(sp.from)) ? one(sp.from) : "";
  const to = DATE.test(one(sp.to)) ? one(sp.to) : "";
  const wanted = Math.max(1, parseInt(one(sp.page)) || 1);
  const pay = one(sp.pay) in PAY_FILTERS ? one(sp.pay) : "";
  const method = isPaymentMethod(one(sp.method)) ? one(sp.method) : "";
  const extra = { ...(pay && { pay }), ...(method && { method }) };
  const hasFilters = Boolean(q || status || from || to || pay || method);

  let query = supabase
    .from("orders")
    .select("id,order_number,customer_name,customer_phone,total,order_status,whatsapp_handoff_status,payment_method,payment_status,created_at,items:order_items(count)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((wanted - 1) * PAGE_SIZE, wanted * PAGE_SIZE - 1);
  if (q) query = query.or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%`);
  if (status) query = query.eq("order_status", status);
  if (pay === "verify") query = query.eq("payment_status", "pending").neq("order_status", "cancelled");
  else if (pay) query = query.eq("payment_status", pay);
  if (method) query = query.eq("payment_method", method);
  if (from) query = query.gte("created_at", `${from}T00:00:00+05:30`);
  if (to) query = query.lte("created_at", `${to}T23:59:59+05:30`);

  const { data, count, error } = await query;
  const rows = (data ?? []) as unknown as { id: string; order_number: string; customer_name: string; customer_phone: string; total: number; order_status: string; whatsapp_handoff_status: string; payment_method: string | null; payment_status: string; created_at: string; items: { count: number }[] }[];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(wanted, pages);
  const keep = { ...(q && { q }), ...(status && { status }), ...(from && { from }), ...(to && { to }), ...extra };
  const hrefFor = (p: number) => `/admin/orders?${new URLSearchParams({ ...keep, ...(p > 1 && { page: String(p) }) })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-4xl">Orders</h1><p className="text-muted-foreground">{total} order{total === 1 ? "" : "s"}</p></div>
        <ReleaseStaleButton />
      </div>

      <div className="flex flex-wrap gap-2">
        {[["", "All"], ...ORDER_STATUSES.map((s) => [s, STATUS_LABEL[s]])].map(([key, label]) => (
          <Link key={key || "all"} href={`/admin/orders?${new URLSearchParams({ ...(q && { q }), ...(key && { status: key }), ...(from && { from }), ...(to && { to }), ...extra })}`}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${status === key ? "border-forest bg-forest text-ivory" : "border-border bg-card hover:bg-secondary"}`}>{label}</Link>
        ))}
      </div>

      <form role="search" className="card space-y-3 p-3">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="grid gap-3 md:grid-cols-[1fr_12rem_12rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input name="q" defaultValue={q} placeholder="Order number, name or phone" aria-label="Search orders" className="field pl-9" />
          </div>
          <select name="pay" defaultValue={pay} aria-label="Payment status" className="field">
            <option value="">Any payment</option>
            {Object.entries(PAY_FILTERS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
          <select name="method" defaultValue={method} aria-label="Payment method" className="field">
            <option value="">Any method</option>
            <option value="cod">Cash on Delivery</option>
            <option value="upi">UPI</option>
          </select>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input type="date" name="from" defaultValue={from} aria-label="From date" className="field" />
          <input type="date" name="to" defaultValue={to} aria-label="To date" className="field" />
          <div className="flex items-center gap-2">
            <button type="submit" className="btn btn-outline flex-1 md:flex-initial">Filter</button>
            {hasFilters && (
              <Link href="/admin/orders" className="btn btn-outline flex-1 text-muted-foreground hover:border-destructive/40 hover:text-destructive md:flex-initial" title="Remove all filters">
                <X className="size-4" aria-hidden />
                <span>Remove filter</span>
              </Link>
            )}
          </div>
        </div>
      </form>

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Active filters:</span>
          {status && (
            <Link
              href={`/admin/orders?${new URLSearchParams({ ...(q && { q }), ...(from && { from }), ...(to && { to }), ...extra })}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs hover:border-destructive hover:text-destructive transition-colors"
              title="Remove status filter"
            >
              <span>Status: {STATUS_LABEL[status as keyof typeof STATUS_LABEL] ?? status}</span>
              <X className="size-3" aria-hidden />
            </Link>
          )}
          {q && (
            <Link
              href={`/admin/orders?${new URLSearchParams({ ...(status && { status }), ...(from && { from }), ...(to && { to }), ...extra })}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs hover:border-destructive hover:text-destructive transition-colors"
              title="Remove search query"
            >
              <span>Search: &ldquo;{q}&rdquo;</span>
              <X className="size-3" aria-hidden />
            </Link>
          )}
          {from && (
            <Link
              href={`/admin/orders?${new URLSearchParams({ ...(status && { status }), ...(q && { q }), ...(to && { to }), ...extra })}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs hover:border-destructive hover:text-destructive transition-colors"
              title="Remove start date"
            >
              <span>From: {from}</span>
              <X className="size-3" aria-hidden />
            </Link>
          )}
          {to && (
            <Link
              href={`/admin/orders?${new URLSearchParams({ ...(status && { status }), ...(q && { q }), ...(from && { from }), ...extra })}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs hover:border-destructive hover:text-destructive transition-colors"
              title="Remove end date"
            >
              <span>To: {to}</span>
              <X className="size-3" aria-hidden />
            </Link>
          )}
          {pay && (
            <Link href={`/admin/orders?${new URLSearchParams({ ...(status && { status }), ...(q && { q }), ...(from && { from }), ...(to && { to }), ...(method && { method }) })}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs transition-colors hover:border-destructive hover:text-destructive" title="Remove payment filter">
              <span>Payment: {PAY_FILTERS[pay]}</span><X className="size-3" aria-hidden />
            </Link>
          )}
          {method && (
            <Link href={`/admin/orders?${new URLSearchParams({ ...(status && { status }), ...(q && { q }), ...(from && { from }), ...(to && { to }), ...(pay && { pay }) })}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs transition-colors hover:border-destructive hover:text-destructive" title="Remove method filter">
              <span>Method: {method === "upi" ? "UPI" : "Cash on Delivery"}</span><X className="size-3" aria-hidden />
            </Link>
          )}
          <Link
            href="/admin/orders"
            className="text-xs font-medium text-forest hover:text-forest-dark hover:underline ml-1"
          >
            Clear all
          </Link>
        </div>
      )}

      {error ? <div className="card p-10 text-center text-destructive">Couldn&apos;t load orders. Please refresh.</div> : rows.length ? (
        <ul className="space-y-2">
          {rows.map((o) => {
            const s = isOrderStatus(o.order_status) ? o.order_status : "submitted";
            const pb = paymentBadge(o.payment_method, o.payment_status, s === "cancelled");
            return (
              <li key={o.id} className="card flex items-stretch overflow-hidden transition-shadow hover:shadow-md">
                <Link href={`/admin/orders/${o.id}`} className="grid flex-1 items-center gap-x-4 gap-y-1 p-4 sm:grid-cols-[8rem_1fr_6rem_8rem_auto]">
                  <span className="font-semibold text-forest-dark">{o.order_number}</span>
                  <span className="min-w-0"><span className="block truncate font-medium">{o.customer_name}</span><span className="text-sm text-muted-foreground">{o.customer_phone} · {o.items[0]?.count ?? 0} item{(o.items[0]?.count ?? 0) === 1 ? "" : "s"}</span></span>
                  <span className="font-semibold">{formatINR(Number(o.total))}</span>
                  <span className="text-sm text-muted-foreground">{formatDate(o.created_at)}</span>
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`badge ${STATUS_BADGE[s]}`}>{STATUS_LABEL[s]}</span>
                    {pb && <span className={`badge ${pb.cls}`}>{pb.label}</span>}
                    {o.whatsapp_handoff_status === "received" && <span className="badge badge-green"><MessageCircle className="mr-1 size-3" aria-hidden />WhatsApp</span>}
                  </span>
                </Link>
                <div className="flex items-center border-l border-border px-2"><DeleteOrderButton id={o.id} number={o.order_number} paid={o.payment_status === "paid"} /></div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="card p-12 text-center text-muted-foreground">
          <p>{hasFilters ? "No orders match these filters." : "No orders yet. They'll appear here as customers submit them."}</p>
          {hasFilters && (
            <div className="mt-4">
              <Link href="/admin/orders" className="btn btn-outline inline-flex items-center gap-2">
                <X className="size-4" aria-hidden />
                <span>Remove filter</span>
              </Link>
            </div>
          )}
        </div>
      )}

      <Pagination page={page} pages={pages} total={total} pageSize={PAGE_SIZE} noun="orders" hrefFor={hrefFor} />
    </div>
  );
}
