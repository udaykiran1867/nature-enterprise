"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Banknote, Loader2, MessageCircle, Smartphone } from "lucide-react";
import { OrderTotals } from "./OrderTotals";
import { useCartReady } from "./useCartReady";
import { submitOrder } from "@/app/(store)/checkout/actions";
import { ProductImage } from "@/components/products/ProductImage";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/formatting";
import { clearIdempotencyKey, getIdempotencyKey } from "@/lib/idempotency";
import type { PaymentMethod, PaymentOptions } from "@/lib/payments";
import { INDIAN_STATES, checkoutFormSchema, type CheckoutFormValues } from "@/schemas/checkout";
import { useCart } from "@/store/cart";

function Field({ label, error, optional, children }: { label: string; error?: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        {label} {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
        <div className="mt-1.5 font-normal">{children}</div>
      </label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function CheckoutForm({ deliveryFee, payment }: { deliveryFee: number; payment: PaymentOptions }) {
  const router = useRouter();
  const ready = useCartReady();
  const { items, clear } = useCart();
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // With a single enabled method it is chosen for the customer; otherwise they pick one.
  const onlyMethod: PaymentMethod | undefined =
    payment.codEnabled && !payment.upiEnabled ? "cod" : !payment.codEnabled && payment.upiEnabled ? "upi" : undefined;

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { name: "", phone: "", address: "", landmark: "", city: "", state: undefined, postalCode: "", notes: "", paymentMethod: onlyMethod },
  });
  const method = useWatch({ control, name: "paymentMethod" });

  if (!ready) return <Skeleton className="h-96 w-full" />;

  if (!items.length && !done) {
    return (
      <div className="card mx-auto max-w-lg px-6 py-14 text-center">
        <h2 className="text-2xl">Your cart is empty</h2>
        <p className="mt-2 text-muted-foreground">Add some spices before checking out.</p>
        <Link href="/products" className="btn btn-primary mt-5">Explore Our Spices</Link>
      </div>
    );
  }

  const subtotal = items.reduce((n, i) => n + i.unitPrice * i.quantity, 0);
  const total = subtotal + deliveryFee;
  const codTooHigh = payment.codEnabled && payment.codMaxAmount > 0 && total > payment.codMaxAmount;
  const choices = [
    payment.codEnabled && {
      value: "cod" as const, title: "Cash on Delivery", Icon: Banknote, disabled: codTooHigh,
      text: "Pay in cash when your order arrives.",
      note: codTooHigh ? `Available for orders up to ${formatINR(payment.codMaxAmount)}.` : undefined,
    },
    payment.upiEnabled && {
      value: "upi" as const, title: "Pay with UPI", Icon: Smartphone, disabled: false,
      text: "Pay with any UPI app. You'll see a QR code after placing your order.",
      note: undefined,
    },
  ].filter(Boolean) as { value: PaymentMethod; title: string; Icon: typeof Banknote; disabled: boolean; text: string; note?: string }[];
  const usable = choices.filter((c) => !c.disabled);

  async function onSubmit(values: CheckoutFormValues) {
    setServerError(null);
    const sig = items.map((i) => `${i.variantId}:${i.quantity}`).sort().join("|");

    let result;
    try {
      result = await submitOrder({
        ...values,
        idempotencyKey: getIdempotencyKey(sig),
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      });
    } catch {
      setServerError("We couldn't reach the server. Please check your connection and try again.");
      return;
    }
    if (!result.ok) { setServerError(result.error); return; }

    setDone(true);
    clearIdempotencyKey();
    window.open(result.whatsappUrl, "_blank", "noopener"); // may be blocked: the confirmation page has a fallback button
    router.push(`/order-success?o=${encodeURIComponent(result.orderNumber)}&t=${result.token}`);
    clear();
  }

  const busy = isSubmitting || done;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-8 lg:grid-cols-[1fr_24rem]">
      <div className="space-y-6">
        <div className="card space-y-5 p-5 sm:p-6">
          <h2 className="text-2xl">Delivery details</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" error={errors.name?.message}>
              <input {...register("name")} autoComplete="name" className="field" aria-invalid={!!errors.name} />
            </Field>
            <Field label="Mobile number" error={errors.phone?.message}>
              <input {...register("phone")} type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" className="field" aria-invalid={!!errors.phone} />
            </Field>
          </div>
          <Field label="Delivery address" error={errors.address?.message}>
            <textarea {...register("address")} rows={3} autoComplete="street-address" className="field h-auto py-2.5" aria-invalid={!!errors.address} />
          </Field>
          <Field label="Landmark" optional error={errors.landmark?.message}>
            <input {...register("landmark")} className="field" />
          </Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="City" error={errors.city?.message}>
              <input {...register("city")} autoComplete="address-level2" className="field" aria-invalid={!!errors.city} />
            </Field>
            <Field label="State" error={errors.state?.message}>
              <select {...register("state")} defaultValue="" autoComplete="address-level1" className="field" aria-invalid={!!errors.state}>
                <option value="" disabled>Select state</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="PIN code" error={errors.postalCode?.message}>
              <input {...register("postalCode")} inputMode="numeric" maxLength={6} autoComplete="postal-code" className="field" aria-invalid={!!errors.postalCode} />
            </Field>
          </div>
          <Field label="Notes for us" optional error={errors.notes?.message}>
            <textarea {...register("notes")} rows={2} className="field h-auto py-2.5" />
          </Field>
        </div>

        <fieldset className="card space-y-4 p-5 sm:p-6">
          <legend className="sr-only">Payment method</legend>
          <h2 className="text-2xl" aria-hidden>Payment method</h2>
          {usable.length === 0 ? (
            <p role="alert" className="rounded-lg border border-terracotta/30 bg-terracotta/5 p-3 text-sm text-terracotta-dark">
              No payment method is available for this order right now. Please contact us on WhatsApp to place it.
            </p>
          ) : (
            <div className={`grid gap-3 ${choices.length > 1 ? "sm:grid-cols-2" : ""}`}>
              {choices.map(({ value, title, Icon, disabled, text, note }) => (
                <label key={value}
                  className={`group relative flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors has-[:checked]:border-forest has-[:checked]:bg-sage/40 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/30 ${disabled ? "cursor-not-allowed border-border opacity-60" : "cursor-pointer border-input hover:bg-secondary/60"}`}>
                  <input type="radio" value={value} disabled={disabled} className="sr-only" {...register("paymentMethod")} />
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sage text-forest"><Icon className="size-5" aria-hidden /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-foreground">{title}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{text}</span>
                    {note && <span className="mt-1 block text-xs font-medium text-terracotta-dark">{note}</span>}
                  </span>
                  <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-input group-has-[:checked]:border-forest" aria-hidden>
                    <span className="size-2.5 rounded-full bg-forest opacity-0 group-has-[:checked]:opacity-100" />
                  </span>
                </label>
              ))}
            </div>
          )}
          {errors.paymentMethod && <p role="alert" className="text-sm text-destructive">{errors.paymentMethod.message}</p>}
          {method === "upi" && (
            <p className="text-sm text-muted-foreground">After you place the order we&apos;ll show the QR code and UPI link. Pay, then send us the payment screenshot or transaction ID on WhatsApp.</p>
          )}
        </fieldset>
      </div>

      <aside className="card h-fit space-y-5 p-5 lg:sticky lg:top-24">
        <h2 className="text-2xl">Your order</h2>
        <ul className="divide-y divide-border">
          {items.map((i) => (
            <li key={i.variantId} className="flex items-center gap-3 py-3 first:pt-0">
              <div className="w-12 shrink-0"><ProductImage path={i.imagePath} alt="" sizes="48px" className="rounded-md" /></div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-medium">{i.name}</p>
                <p className="text-muted-foreground">{i.packLabel} × {i.quantity}</p>
              </div>
              <p className="text-sm font-medium">{formatINR(i.unitPrice * i.quantity)}</p>
            </li>
          ))}
        </ul>
        <OrderTotals subtotal={subtotal} deliveryFee={deliveryFee} />

        {serverError && (
          <div role="alert" className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> <p>{serverError}</p>
          </div>
        )}

        <button type="submit" disabled={busy || usable.length === 0} className="btn btn-accent h-12 w-full text-base">
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <MessageCircle className="size-4" aria-hidden />}
          {busy ? "Saving your order…" : "Send Order on WhatsApp"}
        </button>
        <p className="text-xs leading-relaxed text-muted-foreground">
          We&apos;ll save your order, then open WhatsApp with your message ready. You need to press <strong>Send</strong> in WhatsApp to share it with us.
        </p>
        <Link href="/cart" className="block text-center text-sm text-forest underline-offset-4 hover:underline">Back to cart</Link>
      </aside>
    </form>
  );
}
