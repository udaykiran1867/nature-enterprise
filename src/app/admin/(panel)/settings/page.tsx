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
  const pay = (m.get("payment") ?? {}) as Partial<Record<"payeeName" | "upiId" | "qrImage", string>>;
  const initial: SettingsValues = {
    phone: biz.phone ?? "", email: biz.email ?? "", address: biz.address ?? "", whatsapp: biz.whatsapp ?? "",
    deliveryFee: Number(m.get("delivery_fee") ?? 0) || 0,
    lowStockDefault: Number(m.get("low_stock_default") ?? 5) || 0,
    announcement: typeof m.get("announcement") === "string" ? (m.get("announcement") as string) : "",
    payeeName: pay.payeeName ?? "", upiId: pay.upiId ?? "", qrImage: pay.qrImage ?? "",
  };
  return (
    <div className="space-y-6">
      <div><h1 className="text-4xl">Settings</h1><p className="text-muted-foreground">Business details and store rules. Secret keys stay in server environment variables.</p></div>
      <SettingsForm initial={initial} />
    </div>
  );
}
