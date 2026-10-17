"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { adjustStock } from "@/app/admin/(panel)/inventory/actions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function StockEditor({ variantId, label, current }: { variantId: string; label: string; current: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(String(current));
  const [reason, setReason] = useState("restock");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const n = Number(qty);
  const valid = qty.trim() !== "" && Number.isInteger(n) && n >= 0;
  const delta = valid ? n - current : 0;

  const save = () => start(async () => {
    setError(null);
    const res = await adjustStock({ variantId, quantity: n, reason, note });
    if (!res.ok) { setError(res.error); return; }
    toast.success("Stock updated");
    setOpen(false);
    router.refresh();
  });

  return (
    <>
      <button type="button" onClick={() => { setQty(String(current)); setNote(""); setError(null); setOpen(true); }}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-secondary">
        <Pencil className="size-3.5" aria-hidden /> Update
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update stock</DialogTitle>
            <DialogDescription>{label}. Currently {current} in stock.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="qty" className="mb-1.5 block text-sm font-medium">New quantity</label>
              <input id="qty" type="number" inputMode="numeric" min={0} className="field" value={qty} onChange={(e) => setQty(e.target.value)} />
              {valid && delta !== 0 && <p className="mt-1 text-sm text-muted-foreground">{delta > 0 ? "+" : ""}{delta} compared with now</p>}
            </div>
            <div>
              <label htmlFor="reason" className="mb-1.5 block text-sm font-medium">Reason</label>
              <select id="reason" className="field" value={reason} onChange={(e) => setReason(e.target.value)}>
                <option value="restock">New stock received</option><option value="correction">Count correction</option>
                <option value="damaged">Damaged or expired</option><option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="note" className="mb-1.5 block text-sm font-medium">Note (optional)</label>
              <input id="note" className="field" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={save} disabled={pending || !valid}>
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Save stock
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
