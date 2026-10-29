"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveSettings } from "@/app/admin/(panel)/settings/actions";
import { settingsSchema, type SettingsValues } from "@/schemas/settings";

function Toggle({
  title,
  hint,
  checked,
  onChange,
}: {
  title: string;
  hint: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl border p-4 text-left transition-all ${
        checked
          ? "border-forest bg-sage/35 shadow-xs"
          : "border-border bg-card hover:bg-secondary/40"
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-foreground">{title}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{hint}</span>
      </span>
      <span
        aria-hidden="true"
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
          checked ? "bg-forest" : "bg-[#D2D9C8]"
        }`}
      >
        <span
          className={`inline-block size-5 rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
            checked ? "translate-x-5.5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

const Err = ({ msg }: { msg?: string }) => (msg ? <p role="alert" className="mt-1 text-sm text-destructive">{msg}</p> : null);
const L = ({ htmlFor, children, hint }: { htmlFor: string; children: React.ReactNode; hint?: string }) => (
  <div className="mb-1.5"><label htmlFor={htmlFor} className="block text-sm font-medium">{children}</label>{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>
);

export function SettingsForm({ initial }: { initial: SettingsValues }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initial,
  });

  const codEnabled = useWatch({ control, name: "codEnabled" });
  const upiEnabled = useWatch({ control, name: "upiEnabled" });

  async function onSubmit(v: SettingsValues) {
    setError(null);
    try {
      const res = await saveSettings(v);
      if (!res.ok) { setError(res.error); return; }
      toast.success("Settings saved");
      reset(v);
      router.refresh();
    } catch { setError("Couldn't reach the server. Please try again."); }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <section className="card space-y-5 p-5 sm:p-6">
        <div><h2 className="text-2xl">Business details</h2><p className="text-sm text-muted-foreground">Shown in the store footer and on the contact page.</p></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><L htmlFor="phone">Displayed phone number</L><input id="phone" className="field" {...register("phone")} /><Err msg={errors.phone?.message} /></div>
          <div><L htmlFor="email">Contact email</L><input id="email" type="email" className="field" {...register("email")} /><Err msg={errors.email?.message} /></div>
        </div>
        <div><L htmlFor="address">Business address</L><textarea id="address" rows={2} className="field h-auto py-2.5" {...register("address")} /><Err msg={errors.address?.message} /></div>
        <div className="sm:max-w-sm">
          <L htmlFor="whatsapp" hint="Orders open WhatsApp with this number. Leave empty to use the server setting.">WhatsApp business number</L>
          <input id="whatsapp" inputMode="numeric" placeholder="919876543210" className="field" {...register("whatsapp")} /><Err msg={errors.whatsapp?.message} />
        </div>
      </section>

      <section className="card space-y-5 p-5 sm:p-6">
        <div><h2 className="text-2xl">Payments</h2><p className="text-sm text-muted-foreground">Choose how customers can pay. UPI payments are confirmed by you: check your bank or UPI app, then mark the order as paid.</p></div>
        <div className="grid gap-3 md:grid-cols-2">
          <Toggle
            title="Cash on Delivery"
            hint="Customers pay in cash when the order arrives."
            checked={Boolean(codEnabled)}
            onChange={(next) => setValue("codEnabled", next, { shouldDirty: true, shouldValidate: true })}
          />
          <Toggle
            title="UPI payments"
            hint="Customers see a QR code and UPI link after ordering."
            checked={Boolean(upiEnabled)}
            onChange={(next) => setValue("upiEnabled", next, { shouldDirty: true, shouldValidate: true })}
          />
          <input type="checkbox" className="sr-only" {...register("codEnabled")} />
          <input type="checkbox" className="sr-only" {...register("upiEnabled")} />
        </div>
        <Err msg={errors.codEnabled?.message} />
        <div className={`grid gap-5 sm:grid-cols-2 transition-opacity ${upiEnabled ? "" : "opacity-60"}`}>
          <div><L htmlFor="upiId" hint="Use the UPI ID linked to your business bank account.">UPI ID</L>
            <input id="upiId" autoComplete="off" placeholder="yourname@bank" className="field" {...register("upiId")} /><Err msg={errors.upiId?.message} /></div>
          <div><L htmlFor="upiPayeeName" hint="The name customers see when they pay.">Payee name</L>
            <input id="upiPayeeName" maxLength={60} placeholder="Nature Enterprises" className="field" {...register("upiPayeeName")} /><Err msg={errors.upiPayeeName?.message} /></div>
        </div>
        <div className={`sm:max-w-sm transition-opacity ${codEnabled ? "" : "opacity-60"}`}><L htmlFor="codMaxAmount" hint="Orders above this amount must pay by UPI. Use 0 for no limit.">Maximum order for Cash on Delivery (₹)</L>
          <input id="codMaxAmount" type="number" step="1" min={0} className="field" {...register("codMaxAmount", { valueAsNumber: true })} /><Err msg={errors.codMaxAmount?.message} /></div>
      </section>

      <section className="card space-y-5 p-5 sm:p-6">
        <div><h2 className="text-2xl">Store rules</h2></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><L htmlFor="deliveryFee" hint="Added to every order. Use 0 to confirm delivery on WhatsApp instead.">Delivery fee (₹)</L>
            <input id="deliveryFee" type="number" step="0.01" min={0} className="field" {...register("deliveryFee", { valueAsNumber: true })} /><Err msg={errors.deliveryFee?.message} /></div>
          <div><L htmlFor="lowStockDefault" hint="Starting low-stock alert level for new pack sizes.">Default low-stock threshold</L>
            <input id="lowStockDefault" type="number" min={0} className="field" {...register("lowStockDefault", { valueAsNumber: true })} /><Err msg={errors.lowStockDefault?.message} /></div>
        </div>
        <div><L htmlFor="announcement" hint="Appears as a banner at the top of the store. Leave empty to hide it.">Store announcement</L>
          <input id="announcement" maxLength={160} className="field" {...register("announcement")} /><Err msg={errors.announcement?.message} /></div>
      </section>

      {error && <div role="alert" className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> <p>{error}</p></div>}
      <div className="flex justify-end">
        <button type="submit" disabled={isSubmitting || !isDirty} className="btn btn-primary">{isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />} Save settings</button>
      </div>
    </form>
  );
}
