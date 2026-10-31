"use server";

import { updateTag } from "next/cache";
import { createAdminClient } from "@/lib/admin";
import { getAdmin } from "@/lib/auth";
import { settingsSchema } from "@/schemas/settings";

export async function saveSettings(raw: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "You are not authorised to do this." };
  const p = settingsSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Please fix the highlighted fields." };
  const v = p.data;
  const { data: prev } = await admin.supabase.from("store_settings").select("value").eq("key", "payment").maybeSingle();
  const oldQr = (prev?.value as { qrImage?: string } | null)?.qrImage ?? "";
  const { error } = await admin.supabase.from("store_settings").upsert([
    { key: "business", value: { phone: v.phone, email: v.email, address: v.address, whatsapp: v.whatsapp } },
    { key: "delivery_fee", value: v.deliveryFee },
    { key: "low_stock_default", value: v.lowStockDefault },
    { key: "announcement", value: v.announcement },
    { key: "payment", value: { payeeName: v.payeeName, qrImage: v.qrImage } },
  ], { onConflict: "key" });
  if (error) return { ok: false, error: "Couldn't save settings. Please try again." };
  // Delete the previous QR file once it is no longer used (best effort; never blocks the save).
  if (oldQr && oldQr !== v.qrImage && oldQr.startsWith("payment/")) {
    await createAdminClient().storage.from("product-images").remove([oldQr]).catch(() => undefined);
  }
  updateTag("settings");
  return { ok: true };
}
