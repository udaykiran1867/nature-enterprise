import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireAdmin } from "@/lib/auth";
import type { SettingsValues } from "@/schemas/settings";

export const metadata: Metadata = { title: "Settings" };
export const instant = false;

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("store_settings").select("key,value");
  const m = new Map((data ?? []).map((r) => [r.key as string, r.value as unknown]));
  const biz = (m.get("business") ?? {}) as Partial<Record<"phone" | "email" | "address" | "whatsapp", string>>;
  const pay = (m.get("payment_options") ?? {}) as { cod_enabled?: boolean; upi_enabled?: boolean; cod_max_amount?: number };
  const upi = (m.get("upi_account") ?? {}) as { upi_id?: string; payee_name?: string };
  const initial: SettingsValues = {
    phone: biz.phone ?? "", email: biz.email ?? "", address: biz.address ?? "", whatsapp: biz.whatsapp ?? "",
    deliveryFee: Number(m.get("delivery_fee") ?? 0) || 0,
    lowStockDefault: Number(m.get("low_stock_default") ?? 5) || 0,
    announcement: typeof m.get("announcement") === "string" ? (m.get("announcement") as string) : "",
    codEnabled: pay.cod_enabled ?? true,
    upiEnabled: pay.upi_enabled ?? false,
    codMaxAmount: Number(pay.cod_max_amount ?? 0) || 0,
    upiId: upi.upi_id ?? "",
    upiPayeeName: upi.payee_name ?? "",
  };
  return (
    <div className="space-y-6">
      <div><h1 className="text-4xl">Settings</h1><p className="text-muted-foreground">Business details and store rules. Secret keys stay in server environment variables.</p></div>
      <SettingsForm initial={initial} />
    </div>
  );
}
