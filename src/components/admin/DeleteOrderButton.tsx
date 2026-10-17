"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteOrder } from "@/app/admin/(panel)/orders/actions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function DeleteOrderButton({ id, number, redirectTo, labelled = false }: { id: string; number: string; redirectTo?: string; labelled?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const confirm = () => start(async () => {
    const res = await deleteOrder(id);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success(`Order ${number} deleted`);
    setOpen(false);
    if (redirectTo) router.push(redirectTo); else router.refresh();
  });

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={`Delete order ${number}`}
        className={labelled ? "btn btn-outline h-10 text-destructive hover:bg-destructive/5" : "inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"}>
        <Trash2 className="size-4" aria-hidden /> {labelled && "Delete order"}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete order {number}?</DialogTitle>
            <DialogDescription>
              This permanently removes the order and its history. If it hasn&apos;t shipped yet, its reserved stock goes back to inventory. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)} disabled={pending}>Keep order</button>
            <button type="button" className="btn bg-destructive text-white hover:bg-destructive/90" onClick={confirm} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Delete order
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
