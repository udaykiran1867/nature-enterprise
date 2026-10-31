"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { changeOrderStatus, setWhatsAppReceived } from "@/app/admin/(panel)/orders/actions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NEXT_STATUSES, PROGRESS_STEPS, STATUS_BADGE, STATUS_LABEL, statusWhatsAppUrl, type OrderStatus } from "@/lib/orders";

type Props = { orderId: string; orderNumber: string; customerName: string; customerPhone: string; paymentReady: boolean; status: OrderStatus; whatsappReceived: boolean };

function Progress({ status }: { status: OrderStatus }) {
  if (status === "cancelled") return <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">This order was cancelled.</p>;
  const idx = PROGRESS_STEPS.indexOf(status as (typeof PROGRESS_STEPS)[number]); // -1 while the order is still new
  return (
    <ol className="grid grid-cols-4 gap-1" aria-label="Order progress">
      {PROGRESS_STEPS.map((s, i) => {
        const done = i < idx || (i === idx && status === "delivered");
        const current = i === idx && !done;
        return (
          <li key={s} className="flex flex-col items-center gap-1.5 text-center" aria-current={current ? "step" : undefined}>
            <span className={`flex size-7 items-center justify-center rounded-full border text-xs font-semibold ${done ? "border-forest bg-forest text-white" : current ? "border-forest bg-sage text-forest" : "border-border bg-card text-muted-foreground"}`}>
              {done ? <Check className="size-4" aria-hidden /> : i + 1}
            </span>
            <span className={`text-[0.7rem] leading-tight ${done || current ? "font-medium text-foreground" : "text-muted-foreground"}`}>{STATUS_LABEL[s]}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderStatusPanel({ orderId, orderNumber, customerName, customerPhone, paymentReady, status, whatsappReceived }: Props) {
  const router = useRouter();
  const next = NEXT_STATUSES[status];
  const [picked, setPicked] = useState<string>("");
  // Always a valid next step for the current status (fixes a stale selection after the status changes).
  const target: string = (next as readonly string[]).includes(picked) ? picked : (next[0] ?? "");
  const [note, setNote] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, start] = useTransition();

  const hasPhone = customerPhone.replace(/\D/g, "").length >= 10;

  const apply = (sendWhatsApp: boolean) => {
    const to = target as OrderStatus;
    // Open the WhatsApp tab right now (inside the click) so the browser doesn't block it; it is pointed at the message once the status is saved.
    const tab = sendWhatsApp ? window.open("", "_blank") : null;
    if (tab) tab.opener = null;
    start(async () => {
      const res = await changeOrderStatus(orderId, to, note);
      if (!res.ok) { tab?.close(); toast.error(res.error); return; }
      toast.success(`Status updated to ${STATUS_LABEL[to]}`);
      setConfirmOpen(false);
      if (sendWhatsApp) {
        const url = statusWhatsAppUrl({ name: customerName, phone: customerPhone, orderNumber, status: to, note });
        if (tab) tab.location.href = url;
        else toast("Your browser blocked the WhatsApp window.", { action: { label: "Open WhatsApp", onClick: () => window.open(url, "_blank", "noopener,noreferrer") } });
      }
      setNote("");
      setPicked("");
      router.refresh();
    });
  };

  const toggleWa = () => start(async () => {
    const res = await setWhatsAppReceived(orderId, !whatsappReceived);
    if (!res.ok) toast.error(res.error); else router.refresh();
  });

  return (
    <div className="card space-y-5 p-5">
      <div>
        <h2 className="text-2xl">Status</h2>
        <p className="mt-1 text-sm text-muted-foreground">Current status: <span className={`badge ml-1 ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span></p>
      </div>

      <Progress status={status} />

      <div className="rounded-lg bg-muted p-3 text-sm">
        <p className="font-medium text-foreground">{whatsappReceived ? "WhatsApp message received" : "Waiting for the customer's WhatsApp message"}</p>
        <p className="mt-0.5 text-muted-foreground">{whatsappReceived ? "You marked this order as received on WhatsApp." : "The order is saved, but the customer may not have pressed Send yet."}</p>
        <button type="button" onClick={toggleWa} disabled={pending} className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-forest underline-offset-4 hover:underline">
          <CheckCircle2 className="size-4" aria-hidden /> {whatsappReceived ? "Mark as not received" : "Mark message as received"}
        </button>
      </div>

      {next.length ? (
        <div className="space-y-3">
          <div>
            <label htmlFor="next-status" className="mb-1.5 block text-sm font-medium">Move to</label>
            <select id="next-status" className="field" value={target} onChange={(e) => setPicked(e.target.value)}>
              {next.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="status-note" className="mb-1.5 block text-sm font-medium">Note (optional)</label>
            <input id="status-note" className="field" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {target === "cancelled" && <p className="rounded-lg border border-terracotta/30 bg-terracotta/5 p-3 text-sm text-terracotta-dark">Cancelling returns the reserved stock to inventory. This can&apos;t be undone.</p>}
          <button type="button" onClick={() => setConfirmOpen(true)} disabled={pending || !target} className={`btn w-full ${target === "cancelled" ? "bg-destructive text-white hover:bg-destructive/90" : "btn-primary"}`}>
            {target === "cancelled" ? "Cancel order & restock" : "Update status"}
          </button>
        </div>
      ) : <p className="text-sm text-muted-foreground">This order is {STATUS_LABEL[status].toLowerCase()}, so its status can&apos;t be changed.</p>}

      <Dialog open={confirmOpen} onOpenChange={(o) => !pending && setConfirmOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move order {orderNumber} to {target ? STATUS_LABEL[target as OrderStatus] : ""}?</DialogTitle>
            <DialogDescription>
              {hasPhone
                ? `Do you want to send this status update to ${customerName} on WhatsApp? WhatsApp will open with the message ready, and you press Send.`
                : "This order has no valid phone number, so a WhatsApp message can't be prepared."}
            </DialogDescription>
            {target === "payment" && hasPhone && (
              <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                This message sends the customer a link to the payment page (QR code) and asks them to send the payment screenshot. Once the screenshot arrives, move the order to Confirmed.
                {!paymentReady && <span className="mt-1 block font-medium text-terracotta-dark">Your QR code isn&apos;t uploaded yet, so the payment page will be empty. Upload it in Admin &gt; Settings &gt; Payment QR first.</span>}
              </p>
            )}
          </DialogHeader>
          <DialogFooter>
            <button type="button" className="btn btn-outline" onClick={() => apply(false)} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />} {hasPhone ? "No, just update" : "Update status"}
            </button>
            {hasPhone && (
              <button type="button" className="btn btn-primary" onClick={() => apply(true)} disabled={pending}>
                <MessageCircle className="size-4" aria-hidden /> Yes, update &amp; send
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
