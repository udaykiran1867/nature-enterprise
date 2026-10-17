"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2, TimerReset } from "lucide-react";
import { toast } from "sonner";
import { releaseStaleOrders } from "@/app/admin/(panel)/orders/actions";

export function ReleaseStaleButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = () => {
    if (!window.confirm("Cancel all orders still 'Submitted' with no WhatsApp confirmation for 48 hours, and return their stock?")) return;
    start(async () => {
      const res = await releaseStaleOrders(48);
      if (res.ok) { toast.success(res.message); router.refresh(); } else toast.error(res.error);
    });
  };
  return (
    <button type="button" onClick={run} disabled={pending} className="btn btn-outline">
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <TimerReset className="size-4" aria-hidden />} Release unconfirmed stock
    </button>
  );
}
