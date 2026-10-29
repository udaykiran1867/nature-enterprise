"use server";

import { updateTag } from "next/cache";
import { getAdmin } from "@/lib/auth";
import { settingsSchema } from "@/schemas/settings";

export async function saveSettings(raw: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "You are not authorised to do this." };
  const p = settingsSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Please fix the highlighted fields." };
  const v = p.data;
  const { error } = await admin.supabase.from("store_settings").upsert([
    { key: "business", value: { phone: v.phone, email: v.email, address: v.address, whatsapp: v.whatsapp } },
    { key: "delivery_fee", value: v.deliveryFee },
    { key: "low_stock_default", value: v.lowStockDefault },
    { key: "announcement", value: v.announcement },
    { key: "payment_options", value: { cod_enabled: v.codEnabled, upi_enabled: v.upiEnabled, cod_max_amount: v.codMaxAmount } },
    { key: "upi_account", value: { upi_id: v.upiId, payee_name: v.upiPayeeName } },
  ], { onConflict: "key" });
  if (error) return { ok: false, error: "Couldn't save settings. Please try again." };
  updateTag("settings");
  return { ok: true };
}
