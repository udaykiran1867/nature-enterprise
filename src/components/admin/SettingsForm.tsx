"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveSettings } from "@/app/admin/(panel)/settings/actions";
import { settingsSchema, type SettingsValues } from "@/schemas/settings";

const Err = ({ msg }: { msg?: string }) => (msg ? <p role="alert" className="mt-1 text-sm text-destructive">{msg}</p> : null);
const L = ({ htmlFor, children, hint }: { htmlFor: string; children: React.ReactNode; hint?: string }) => (
  <div className="mb-1.5"><label htmlFor={htmlFor} className="block text-sm font-medium">{children}</label>{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>
);

export function SettingsForm({ initial }: { initial: SettingsValues }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty }, reset } = useForm<SettingsValues>({ resolver: zodResolver(settingsSchema), defaultValues: initial });

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
