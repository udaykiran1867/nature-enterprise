"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, Mail, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteMessage, setMessageRead } from "@/app/admin/(panel)/messages/actions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Props = { id: string; isRead: boolean; name: string; mailto: string; whatsapp: string | null };
const b = "inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-secondary disabled:opacity-50";

export function MessageActions({ id, isRead, name, mailto, whatsapp }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const toggle = () => start(async () => {
    const res = await setMessageRead(id, !isRead);
    if (!res.ok) toast.error(res.error); else router.refresh();
  });
  const remove = () => start(async () => {
    const res = await deleteMessage(id);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success("Message deleted"); setOpen(false); router.refresh();
  });

  return (
    <div className="flex flex-wrap gap-2">
      <a href={mailto} className={b}><Mail className="size-3.5" aria-hidden /> Reply by email</a>
      {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={b}><MessageCircle className="size-3.5" aria-hidden /> WhatsApp</a>}
      <button type="button" onClick={toggle} disabled={pending} className={b}>
        {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Check className="size-3.5" aria-hidden />} {isRead ? "Mark unread" : "Mark as read"}
      </button>
      <button type="button" onClick={() => setOpen(true)} className={`${b} text-destructive hover:bg-destructive/5`}><Trash2 className="size-3.5" aria-hidden /> Delete</button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this message?</DialogTitle>
            <DialogDescription>The message from {name} will be permanently removed.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</button>
            <button type="button" className="btn bg-destructive text-white hover:bg-destructive/90" onClick={remove} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Delete message
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
