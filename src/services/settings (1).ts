import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/public";

export type BusinessInfo = { phone: string; email: string; address: string; whatsapp: string };
export type PaymentInfo = { payeeName: string; upiId: string; qrImage: string };
export type PublicSettings = { deliveryFee: number; announcement: string; business: BusinessInfo; payment: PaymentInfo };

const EMPTY_BUSINESS: BusinessInfo = { phone: "", email: "", address: "", whatsapp: "" };

export async function getPublicSettings(): Promise<PublicSettings> {
  "use cache";
  cacheLife("minutes");
  cacheTag("settings");
  const { data } = await createPublicClient().from("store_settings").select("key,value");
  const map = new Map((data ?? []).map((r) => [r.key as string, r.value as unknown]));
  const fee = Number(map.get("delivery_fee") ?? 0);
  const biz = (map.get("business") ?? {}) as Partial<BusinessInfo>;
  const pay = (map.get("payment") ?? {}) as Partial<PaymentInfo>;
  return {
    deliveryFee: Number.isFinite(fee) && fee > 0 ? fee : 0,
    announcement: typeof map.get("announcement") === "string" ? (map.get("announcement") as string) : "",
    business: { ...EMPTY_BUSINESS, ...biz },
    payment: {
      payeeName: typeof pay.payeeName === "string" ? pay.payeeName.trim() : "",
      upiId: typeof pay.upiId === "string" ? pay.upiId.trim() : "",
      qrImage: typeof pay.qrImage === "string" && pay.qrImage.startsWith("payment/") ? pay.qrImage : "",
    },
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
