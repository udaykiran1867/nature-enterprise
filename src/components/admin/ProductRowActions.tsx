"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, EyeOff, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProduct, setPublished } from "@/app/admin/(panel)/products/actions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ProductRowActions({ id, name, isActive }: { id: string; name: string; isActive: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  const toggle = () => start(async () => {
    const res = await setPublished(id, !isActive);
    if (!res.ok) toast.error(res.error);
    else { toast.success(isActive ? "Moved to drafts" : "Published"); router.refresh(); }
  });
  const remove = () => start(async () => {
    const res = await deleteProduct(id);
    if (!res.ok) toast.error(res.error);
    else { toast.success("Product deleted"); setOpen(false); router.refresh(); }
  });

  const b = "inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-secondary disabled:opacity-50";
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/admin/products/${id}/edit`} className={b}><Pencil className="size-3.5" aria-hidden /> Edit</Link>
      <button type="button" onClick={toggle} disabled={pending} className={b}>
        {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : isActive ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
        {isActive ? "Unpublish" : "Publish"}
      </button>
      <button type="button" onClick={() => setOpen(true)} className={`${b} text-destructive hover:bg-destructive/5`}><Trash2 className="size-3.5" aria-hidden /> Delete</button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{name}”?</DialogTitle>
            <DialogDescription>This permanently removes the product, its pack sizes and its image. Past orders keep their own record of what was bought.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</button>
            <button type="button" className="btn bg-destructive text-white hover:bg-destructive/90" onClick={remove} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Delete product
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
