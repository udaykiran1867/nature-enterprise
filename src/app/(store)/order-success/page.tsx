import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Banknote, CheckCircle2, MessageCircle } from "lucide-react";
import { CopyMessage } from "@/components/cart/CopyMessage";
import { UpiPayment } from "@/components/cart/UpiPayment";
import { Skeleton } from "@/components/ui/skeleton";
import { PAYMENT_METHOD_LABEL } from "@/lib/payments";
import { getUpiAccount } from "@/services/payments";
import { formatINR } from "@/lib/formatting";
import { buildOrderMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { getOrderForConfirmation } from "@/services/orders";
import { resolveWhatsAppNumber } from "@/services/settings";

export const metadata: Metadata = { title: "Order received", robots: { index: false, follow: false } };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

async function Confirmation({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const order = await getOrderForConfirmation(one(sp.o), one(sp.t));

  if (!order) {
    return (
      <div className="card mx-auto max-w-lg px-6 py-14 text-center">
        <h1 className="text-3xl">We couldn&apos;t find that order</h1>
        <p className="mt-2 text-muted-foreground">The link may be incomplete. If you placed an order, please contact us with your reference number.</p>
        <Link href="/products" className="btn btn-primary mt-6">Return to Shopping</Link>
      </div>
    );
  }

  const message = buildOrderMessage(order);
  const wa = await resolveWhatsAppNumber();
  const upi = order.paymentMethod === "upi" && order.paymentStatus === "pending" ? await getUpiAccount() : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-sage text-forest"><CheckCircle2 className="size-8" aria-hidden /></span>
        <h1 className="mt-4 text-4xl">Your order is saved</h1>
        <p className="mt-2 text-muted-foreground">Reference <span className="font-semibold text-forest-dark">{order.orderNumber}</span></p>
      </div>

      <div className="rounded-xl border border-terracotta/30 bg-terracotta/5 p-5">
        <h2 className="font-sans text-base font-semibold text-foreground">One last step: send it on WhatsApp</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We opened WhatsApp with your order message ready. Please press <strong>Send</strong> there. Your order isn&apos;t shared with us until you do. If WhatsApp didn&apos;t open, use the buttons below.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {wa && (
            <a href={buildWhatsAppUrl(wa, message)} target="_blank" rel="noopener noreferrer" className="btn btn-accent">
              <MessageCircle className="size-4" aria-hidden /> Open WhatsApp
            </a>
          )}
          <CopyMessage message={message} />
        </div>
      </div>

      {order.paymentMethod === "cod" && (
        <div className="card flex items-start gap-4 p-5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sage text-forest"><Banknote className="size-5" aria-hidden /></span>
          <div>
            <h2 className="font-sans text-base font-semibold text-foreground">Cash on Delivery</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Please keep <strong className="text-foreground">{formatINR(order.total)}</strong> ready to pay when your order arrives. We&apos;ll confirm the details with you on WhatsApp.</p>
          </div>
        </div>
      )}
      {order.paymentMethod === "upi" && order.paymentStatus === "paid" && (
        <div className="card flex items-start gap-4 p-5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sage text-forest"><CheckCircle2 className="size-5" aria-hidden /></span>
          <div><h2 className="font-sans text-base font-semibold text-foreground">Payment received</h2><p className="mt-0.5 text-sm text-muted-foreground">Thank you! Your UPI payment has been confirmed.</p></div>
        </div>
      )}
      {order.paymentMethod === "upi" && order.paymentStatus === "pending" && (upi
        ? <UpiPayment orderNumber={order.orderNumber} amount={order.total} upiId={upi.upiId} payeeName={upi.payeeName} whatsappNumber={wa} />
        : <div className="card p-5 text-sm text-muted-foreground">We&apos;ll share the UPI payment details with you on WhatsApp shortly.</div>)}

      <div className="card p-5">
        <h2 className="text-2xl">Order summary</h2>
        <ul className="mt-3 divide-y divide-border text-sm">
          {order.items.map((i, n) => (
            <li key={n} className="flex justify-between gap-4 py-2.5">
              <span>{i.name} <span className="text-muted-foreground">· {i.pack} × {i.quantity}</span></span>
              <span className="font-medium">{formatINR(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatINR(order.subtotal)}</dd></div>
          {order.deliveryFee > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd>{formatINR(order.deliveryFee)}</dd></div>}
          <div className="flex justify-between text-base font-semibold text-forest"><dt>Total</dt><dd>{formatINR(order.total)}</dd></div>
          {order.paymentMethod && <div className="flex justify-between pt-1"><dt className="text-muted-foreground">Payment</dt><dd>{PAYMENT_METHOD_LABEL[order.paymentMethod]}</dd></div>}
        </dl>
        <p className="mt-4 text-sm text-muted-foreground">Delivering to {order.customer.name}, {order.customer.city} {order.customer.postalCode}</p>
      </div>

      <div className="text-center"><Link href="/products" className="btn btn-primary">Return to Shopping</Link></div>
    </div>
  );
}

export default function OrderSuccessPage({ searchParams }: PageProps<"/order-success">) {
  return (
    <div className="container-page py-10 md:py-14">
      <Suspense fallback={<Skeleton className="mx-auto h-96 max-w-2xl" />}>
        <Confirmation searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
