import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/public";
import type { PaymentOptions } from "@/lib/payments";

export type BusinessInfo = { phone: string; email: string; address: string; whatsapp: string };
export type PublicSettings = { deliveryFee: number; announcement: string; business: BusinessInfo };

const EMPTY_BUSINESS: BusinessInfo = { phone: "", email: "", address: "", whatsapp: "" };

export async function getPublicSettings(): Promise<PublicSettings> {
  "use cache";
  cacheLife("minutes");
  cacheTag("settings");
  const { data } = await createPublicClient().from("store_settings").select("key,value");
  const map = new Map((data ?? []).map((r) => [r.key as string, r.value as unknown]));
  const fee = Number(map.get("delivery_fee") ?? 0);
  const biz = (map.get("business") ?? {}) as Partial<BusinessInfo>;
  return {
    deliveryFee: Number.isFinite(fee) && fee > 0 ? fee : 0,
    announcement: typeof map.get("announcement") === "string" ? (map.get("announcement") as string) : "",
    business: { ...EMPTY_BUSINESS, ...biz },
  };
}

export const getDeliveryFee = async () => (await getPublicSettings()).deliveryFee;

/** WhatsApp number from admin settings, falling back to the WHATSAPP_BUSINESS_NUMBER env var. Digits only, or null. */
export async function resolveWhatsAppNumber(): Promise<string | null> {
  const { business } = await getPublicSettings();
  const fromSettings = business.whatsapp.replace(/\D/g, "");
  if (/^\d{10,15}$/.test(fromSettings)) return fromSettings;
  const env = process.env.WHATSAPP_BUSINESS_NUMBER?.replace(/\D/g, "") ?? "";
  return /^\d{10,15}$/.test(env) && !/X/i.test(process.env.WHATSAPP_BUSINESS_NUMBER ?? "") ? env : null;
}

/** Which payment methods customers can use (public; the UPI ID itself is private). */
export async function getPaymentOptions(): Promise<PaymentOptions> {
  "use cache";
  cacheLife("minutes");
  cacheTag("settings");
  const { data } = await createPublicClient().from("store_settings").select("value").eq("key", "payment_options").maybeSingle();
  const v = (data?.value ?? {}) as { cod_enabled?: boolean; upi_enabled?: boolean; cod_max_amount?: number };
  const cap = Number(v.cod_max_amount ?? 0);
  return { codEnabled: v.cod_enabled ?? true, upiEnabled: v.upi_enabled ?? false, codMaxAmount: Number.isFinite(cap) && cap > 0 ? cap : 0 };
}
