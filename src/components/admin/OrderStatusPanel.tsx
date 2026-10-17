"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { changeOrderStatus, setWhatsAppReceived } from "@/app/admin/(panel)/orders/actions";
import { NEXT_STATUSES, STATUS_BADGE, STATUS_LABEL, type OrderStatus } from "@/lib/orders";

export function OrderStatusPanel({ orderId, status, whatsappReceived }: { orderId: string; status: OrderStatus; whatsappReceived: boolean }) {
  const router = useRouter();
  const next = NEXT_STATUSES[status];
  const [target, setTarget] = useState<string>(next[0] ?? "");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  const apply = () => start(async () => {
    const res = await changeOrderStatus(orderId, target, note);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success(`Order marked ${STATUS_LABEL[target as OrderStatus].toLowerCase()}`);
    setNote("");
    router.refresh();
  });
  const toggleWa = () => start(async () => {
    const res = await setWhatsAppReceived(orderId, !whatsappReceived);
    if (!res.ok) toast.error(res.error); else router.refresh();
  });

  return (
    <div className="card space-y-5 p-5">
      <div>
        <h2 className="text-2xl">Status</h2>
        <span className={`badge mt-2 ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>
      </div>

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
            <select id="next-status" className="field" value={target} onChange={(e) => setTarget(e.target.value)}>
              {next.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="status-note" className="mb-1.5 block text-sm font-medium">Note (optional)</label>
            <input id="status-note" className="field" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {target === "cancelled" && <p className="rounded-lg border border-terracotta/30 bg-terracotta/5 p-3 text-sm text-terracotta-dark">Cancelling returns the reserved stock to inventory. This can&apos;t be undone.</p>}
          <button type="button" onClick={apply} disabled={pending || !target} className={`btn w-full ${target === "cancelled" ? "bg-destructive text-white hover:bg-destructive/90" : "btn-primary"}`}>
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden />} {target === "cancelled" ? "Cancel order & restock" : "Update status"}
          </button>
        </div>
      ) : <p className="text-sm text-muted-foreground">This order is {STATUS_LABEL[status].toLowerCase()}, so its status can&apos;t be changed.</p>}
    </div>
  );
}
