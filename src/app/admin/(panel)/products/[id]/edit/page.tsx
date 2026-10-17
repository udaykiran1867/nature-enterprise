import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/auth";
import { sortVariants } from "@/lib/products";
import type { ProductFormValues } from "@/schemas/product";
import type { Variant } from "@/types";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]/edit">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { supabase } = await requireAdmin();
  const [{ data: p }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*, variants:product_variants(*)").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id,name").order("name"),
  ]);
  if (!p) notFound();

  const initial: ProductFormValues = {
    name: p.name, slug: p.slug, description: p.description ?? "", category_id: p.category_id ?? "", new_category: "",
    image_path: p.image_path ?? "", image_alt: p.image_alt ?? "", is_active: p.is_active, is_featured: p.is_featured,
    seo_title: p.seo_title ?? "", seo_description: p.seo_description ?? "",
    variants: sortVariants(p.variants as unknown as Variant[]).map((v) => ({
      id: v.id, pack_size: Number(v.pack_size), unit: v.unit as ProductFormValues["variants"][number]["unit"],
      sku: (v as unknown as { sku: string | null }).sku ?? "", price: Number(v.price),
      stock_quantity: v.stock_quantity, low_stock_threshold: v.low_stock_threshold, is_available: v.is_available,
    })),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-4xl">Edit product</h1>
      <ProductForm categories={categories ?? []} productId={p.id} initial={initial} />
    </div>
  );
}
