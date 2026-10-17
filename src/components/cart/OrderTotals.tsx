import { formatINR } from "@/lib/formatting";

export function OrderTotals({ subtotal, deliveryFee }: { subtotal: number; deliveryFee: number }) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-medium">{formatINR(subtotal)}</dd></div>
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Delivery</dt>
        <dd className="font-medium">{deliveryFee > 0 ? formatINR(deliveryFee) : "Confirmed on WhatsApp"}</dd>
      </div>
      <div className="flex justify-between border-t border-border pt-3 text-base">
        <dt className="font-semibold text-forest-dark">Estimated total</dt>
        <dd className="text-xl font-semibold text-forest">{formatINR(subtotal + deliveryFee)}</dd>
      </div>
    </dl>
  );
}
