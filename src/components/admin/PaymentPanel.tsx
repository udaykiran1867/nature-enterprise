"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Banknote, Check, Loader2, MessageCircle, RotateCcw, Smartphone, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { changePaymentStatus } from "@/app/admin/(panel)/orders/actions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDateTime, formatINR } from "@/lib/formatting";
import { PAYMENT_METHOD_LABEL, paymentBadge, type PaymentMethod, type PaymentStatus } from "@/lib/payments";

type Props = {
  orderId: string; method: PaymentMethod | null; status: PaymentStatus; amount: number; reference: string | null;
  paidAt: string | null; refundedAt: string | null; orderCancelled: boolean; reminderUrl: string | null;
};

export function PaymentPanel({ orderId, method, status, amount, reference, paidAt, refundedAt, orderCancelled, reminderUrl }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [ref, setRef] = useState("");
  const [confirmRefund, setConfirmRefund] = useState(false);
  const badge = paymentBadge(method, status, orderCancelled);

  const apply = (next: PaymentStatus, done: string) => start(async () => {
    const res = await changePaymentStatus(orderId, next, ref);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success(done);
    setRef(""); setConfirmRefund(false);
    router.refresh();
  });

  const Icon = method === "upi" ? Smartphone : Banknote;
  const row = "flex items-start justify-between gap-4";

  return (
    <div className="card space-y-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl">Payment</h2>
        {badge && <span className={`badge ${badge.cls}`}>{badge.label}</span>}
      </div>

      {!method ? (
        <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">No payment method was recorded. This order was placed before payment options were added.</p>
      ) : (
        <>
          <dl className="space-y-2 text-sm">
            <div className={row}><dt className="text-muted-foreground">Method</dt><dd className="flex items-center gap-1.5 font-medium"><Icon className="size-4 text-forest" aria-hidden /> {PAYMENT_METHOD_LABEL[method]}</dd></div>
            <div className={row}><dt className="text-muted-foreground">Amount</dt><dd className="font-semibold text-forest">{formatINR(amount)}</dd></div>
            {reference && <div className={row}><dt className="text-muted-foreground">Reference</dt><dd className="break-all text-right font-medium">{reference}</dd></div>}
            {paidAt && <div className={row}><dt className="text-muted-foreground">{method === "cod" ? "Cash collected" : "Paid on"}</dt><dd className="text-right">{formatDateTime(paidAt)}</dd></div>}
            {refundedAt && <div className={row}><dt className="text-muted-foreground">Refunded on</dt><dd className="text-right">{formatDateTime(refundedAt)}</dd></div>}
          </dl>

          {orderCancelled && status === "paid" && (
            <p role="alert" className="rounded-lg border border-terracotta/30 bg-terracotta/5 p-3 text-sm text-terracotta-dark">
              This order is cancelled but the payment was received. Refund the customer, then mark it as refunded.
            </p>
          )}
          {orderCancelled && status === "pending" && <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">This order is cancelled, so no payment is due.</p>}

          {status === "pending" && !orderCancelled && (
            <div className="space-y-3 border-t border-border pt-4">
              {method === "upi" ? (
                <>
                  <p className="text-sm text-muted-foreground">Check your bank or UPI app for the money before marking it as paid.</p>
                  <div>
                    <label htmlFor="pay-ref" className="mb-1.5 block text-sm font-medium">UPI transaction ID <span className="font-normal text-muted-foreground">(optional)</span></label>
                    <input id="pay-ref" className="field" maxLength={80} value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. 412345678901" />
                  </div>
                  <button type="button" disabled={pending} onClick={() => apply("paid", "Payment marked as paid")} className="btn btn-primary w-full">
                    {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" aria-hidden />} Mark as paid
                  </button>
                  {reminderUrl && (
                    <a href={reminderUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full"><MessageCircle className="size-4" aria-hidden /> Send payment reminder</a>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Mark this once the delivery person has collected the cash.</p>
                  <button type="button" disabled={pending} onClick={() => apply("paid", "Cash marked as collected")} className="btn btn-primary w-full">
                    {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" aria-hidden />} Mark cash collected
                  </button>
                </>
              )}
            </div>
          )}

          {status === "paid" && (
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <button type="button" disabled={pending} onClick={() => apply("pending", "Payment marked as not received")} className="btn btn-outline h-10 flex-1">
                <Undo2 className="size-4" aria-hidden /> Mark as unpaid
              </button>
              <button type="button" disabled={pending} onClick={() => setConfirmRefund(true)} className="btn btn-outline h-10 flex-1 text-destructive hover:bg-destructive/5">
                <RotateCcw className="size-4" aria-hidden /> Mark refunded
              </button>
            </div>
          )}
        </>
      )}

      <Dialog open={confirmRefund} onOpenChange={setConfirmRefund}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark this payment as refunded?</DialogTitle>
            <DialogDescription>Only do this after you have returned {formatINR(amount)} to the customer. A refunded payment can&apos;t be changed again.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button" className="btn btn-outline" onClick={() => setConfirmRefund(false)} disabled={pending}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={() => apply("refunded", "Payment marked as refunded")} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Yes, mark refunded
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
