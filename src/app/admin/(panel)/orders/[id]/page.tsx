import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { DeleteOrderButton } from "@/components/admin/DeleteOrderButton";
import { OrderStatusPanel } from "@/components/admin/OrderStatusPanel";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime, formatINR } from "@/lib/formatting";
import { STATUS_BADGE, STATUS_LABEL, isOrderStatus, type OrderStatus } from "@/lib/orders";

export const metadata: Metadata = { title: "Order" };
export const instant = false;

export default async function OrderDetailPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { supabase } = await requireAdmin();
  const { data: o } = await supabase.from("orders").select("*, items:order_items(*), history:order_status_history(*)").eq("id", id).maybeSingle();
  if (!o) notFound();

  const raw: string = o.order_status;
  const status: OrderStatus = isOrderStatus(raw) ? raw : "submitted";
  const history = [...(o.history as { id: string; from_status: string | null; to_status: string; note: string | null; created_at: string }[])].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const items = o.items as { id: string; product_name_snapshot: string; pack_size_snapshot: string; unit_price: number; quantity: number; line_total: number }[];
  const followUp = `https://wa.me/91${String(o.customer_phone).replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(`Hello ${o.customer_name}, this is Nature Enterprises regarding your order ${o.order_number}.`)}`;

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-forest"><ArrowLeft className="size-4" aria-hidden /> All orders</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-4xl">{o.order_number}</h1>
        <span className={`badge ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>
        <div className="ml-auto"><DeleteOrderButton id={o.id} number={o.order_number} redirectTo="/admin/orders" labelled /></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="text-2xl">Customer</h2>
            <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Name</dt><dd className="font-medium">{o.customer_name}</dd></div>
              <div><dt className="text-muted-foreground">Phone</dt><dd className="font-medium">{o.customer_phone}</dd></div>
              <div className="sm:col-span-2"><dt className="text-muted-foreground">Delivery address</dt>
                <dd className="font-medium">{o.delivery_address}{o.landmark ? `, near ${o.landmark}` : ""}<br />{o.city}, {o.state} {o.postal_code}</dd></div>
              {o.customer_notes && <div className="sm:col-span-2"><dt className="text-muted-foreground">Customer notes</dt><dd className="font-medium">{o.customer_notes}</dd></div>}
            </dl>
            <a href={followUp} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-4"><MessageCircle className="size-4" aria-hidden /> Message customer on WhatsApp</a>
          </section>

          <section className="card overflow-hidden">
            <h2 className="border-b border-border px-5 py-4 text-2xl">Items</h2>
            <ul className="divide-y divide-border text-sm">
              {items.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                  <span className="font-medium">{i.product_name_snapshot} <span className="font-normal text-muted-foreground">· {i.pack_size_snapshot}</span></span>
                  <span className="text-muted-foreground">{formatINR(Number(i.unit_price))} × {i.quantity}</span>
                  <span className="w-24 text-right font-semibold">{formatINR(Number(i.line_total))}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1 border-t border-border bg-muted/50 px-5 py-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatINR(Number(o.subtotal))}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Delivery fee</dt><dd>{formatINR(Number(o.delivery_fee))}</dd></div>
              <div className="flex justify-between text-base font-semibold text-forest"><dt>Total</dt><dd>{formatINR(Number(o.total))}</dd></div>
            </dl>
          </section>
        </div>

        <div className="space-y-6">
          <OrderStatusPanel orderId={o.id} status={status} whatsappReceived={o.whatsapp_handoff_status === "received"} />
          <section className="card p-5">
            <h2 className="text-2xl">Timeline</h2>
            <ol className="mt-4 space-y-4 border-l border-border pl-5 text-sm">
              <li className="relative"><span className="absolute -left-[1.55rem] top-1.5 size-2.5 rounded-full bg-forest" aria-hidden /><p className="font-medium">Order saved</p><time className="text-muted-foreground" dateTime={o.created_at}>{formatDateTime(o.created_at)}</time></li>
              {history.map((h) => (
                <li key={h.id} className="relative"><span className="absolute -left-[1.55rem] top-1.5 size-2.5 rounded-full bg-terracotta" aria-hidden />
                  <p className="font-medium">{isOrderStatus(h.to_status) ? STATUS_LABEL[h.to_status] : h.to_status}</p>
                  {h.note && <p className="text-muted-foreground">{h.note}</p>}
                  <time className="text-muted-foreground" dateTime={h.created_at}>{formatDateTime(h.created_at)}</time></li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
