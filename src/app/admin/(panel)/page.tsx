import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Boxes, ClipboardCheck, ClipboardList, Eye, Package, PackageX, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatINR } from "@/lib/formatting";
import { STATUS_BADGE, STATUS_LABEL, isOrderStatus } from "@/lib/orders";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminOverview() {
  const { supabase } = await requireAdmin();
  const count = (s: string) => supabase.from("orders").select("id", { count: "exact", head: true }).eq("order_status", s);
  const [products, variants, fresh, awaiting, recent] = await Promise.all([
    supabase.from("products").select("id,is_active"),
    supabase.from("product_variants").select("stock_quantity,low_stock_threshold"),
    count("submitted"),
    count("awaiting_confirmation"),
    supabase.from("orders").select("id,order_number,customer_name,total,order_status,created_at").order("created_at", { ascending: false }).limit(6),
  ]);

  const p = products.data ?? [];
  const v = variants.data ?? [];
  const stats = [
    { label: "Total products", value: p.length, icon: Package, href: "/admin/products" },
    { label: "Published", value: p.filter((x) => x.is_active).length, icon: Eye, href: "/admin/products?status=published" },
    { label: "Low-stock sizes", value: v.filter((x) => x.stock_quantity > 0 && x.stock_quantity <= x.low_stock_threshold).length, icon: AlertTriangle, href: "/admin/inventory?status=low" },
    { label: "Out-of-stock sizes", value: v.filter((x) => x.stock_quantity === 0).length, icon: PackageX, href: "/admin/inventory?status=out" },
    { label: "New orders", value: fresh.count ?? 0, icon: ClipboardList, href: "/admin/orders?status=submitted" },
    { label: "Awaiting confirmation", value: awaiting.count ?? 0, icon: ClipboardCheck, href: "/admin/orders?status=awaiting_confirmation" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-4xl">Overview</h1><p className="text-muted-foreground">A live snapshot of your store.</p></div>
        <div className="flex gap-2">
          <Link href="/admin/orders" className="btn btn-outline">View orders</Link>
          <Link href="/admin/products/new" className="btn btn-primary"><Plus className="size-4" aria-hidden /> Add Product</Link>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <li key={label}>
            <Link href={href} className="card group block h-full p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <span className="flex size-9 items-center justify-center rounded-lg bg-sage text-forest transition-colors group-hover:bg-forest group-hover:text-ivory"><Icon className="size-4" aria-hidden /></span>
              <p className="mt-3 text-3xl font-semibold text-forest-dark">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </Link>
          </li>
        ))}
      </ul>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2"><Boxes className="size-4 text-forest" aria-hidden /><h2 className="font-sans text-base font-semibold">Recent orders</h2></div>
          <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm font-medium text-forest hover:underline">View all <ArrowRight className="size-3.5" aria-hidden /></Link>
        </div>
        {recent.data?.length ? (
          <ul className="divide-y divide-border">
            {recent.data.map((o) => {
              const s = isOrderStatus(o.order_status) ? o.order_status : "submitted";
              return (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-3 text-sm hover:bg-muted/50">
                    <span className="font-medium text-forest-dark">{o.order_number}</span>
                    <span className="flex-1 text-muted-foreground">{o.customer_name}</span>
                    <span className={`badge ${STATUS_BADGE[s]}`}>{STATUS_LABEL[s]}</span>
                    <span className="w-24 text-right font-medium">{formatINR(Number(o.total))}</span>
                    <time className="w-28 text-right text-muted-foreground" dateTime={o.created_at}>{formatDate(o.created_at)}</time>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : <p className="px-5 py-10 text-center text-sm text-muted-foreground">No orders yet. They&apos;ll appear here as customers submit them.</p>}
      </section>
    </div>
  );
}
