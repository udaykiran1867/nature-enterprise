import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/public";
import type { Category, Product } from "@/types";

const PRODUCT_SELECT =
  "id,name,slug,description,how_to_use,image_path,image_alt,is_featured,category:categories(id,name,slug),variants:product_variants(id,pack_size,unit,price,stock_quantity,low_stock_threshold,is_available)";

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("categories");
  const { data, error } = await createPublicClient()
    .from("categories")
    .select("id,name,slug,description")
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error("Could not load categories");
  return data ?? [];
}

export type ProductQuery = { q?: string; category?: string; featured?: boolean; limit?: number; excludeId?: string };

export async function getProducts(opts: ProductQuery = {}): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");
  const supabase = createPublicClient();

  let query = supabase.from("products").select(PRODUCT_SELECT).eq("is_active", true).order("name");
  if (opts.q) query = query.ilike("name", `%${opts.q.replace(/[%_,()]/g, " ")}%`);
  if (opts.featured) query = query.eq("is_featured", true);
  if (opts.excludeId) query = query.neq("id", opts.excludeId);
  if (opts.limit) query = query.limit(opts.limit);
  if (opts.category) {
    const { data: cat } = await supabase.from("categories").select("id").eq("slug", opts.category).eq("is_active", true).maybeSingle();
    if (!cat) return [];
    query = query.eq("category_id", cat.id);
  }
  const { data, error } = await query;
  if (error) throw new Error("Could not load products");
  return (data ?? []) as unknown as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products", `product:${slug}`);
  const { data, error } = await createPublicClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error("Could not load product");
  return (data as unknown as Product) ?? null;
}
