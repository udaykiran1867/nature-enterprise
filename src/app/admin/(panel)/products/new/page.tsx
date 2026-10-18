import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "New product" };
export const instant = false;

export default async function NewProductPage() {
  const { supabase } = await requireAdmin();
  const [{ data: categories }, { data: low }] = await Promise.all([
    supabase.from("categories").select("id,name").order("name"),
    supabase.from("store_settings").select("value").eq("key", "low_stock_default").maybeSingle(),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-4xl">Add product</h1>
      <ProductForm categories={categories ?? []} defaultLowStock={Number(low?.value ?? 5) || 0} />
    </div>
  );
}
