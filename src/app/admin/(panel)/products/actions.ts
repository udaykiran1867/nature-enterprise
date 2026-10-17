"use server";

import { updateTag } from "next/cache";
import { getAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/admin";
import { slugify } from "@/lib/slug";
import { productSchema } from "@/schemas/product";

type Result = { ok: true; id?: string } | { ok: false; error: string; field?: "slug" };

async function removeImage(path: string | null | undefined) {
  if (!path || !path.startsWith("products/")) return;
  await createAdminClient().storage.from("product-images").remove([path]);
}

function refresh(...slugs: (string | null | undefined)[]) {
  updateTag("products");
  updateTag("categories");
  slugs.forEach((s) => s && updateTag(`product:${s}`));
}

export async function saveProduct(raw: unknown, id?: string): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "You are not authorised to do this." };
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields." };
  const v = parsed.data;
  const { supabase } = admin;

  let categoryId = v.category_id === "__new__" ? "" : v.category_id;
  if (v.category_id === "__new__") {
    const slug = slugify(v.new_category) || `category-${Date.now()}`;
    const { data: existing } = await supabase.from("categories").select("id").eq("slug", slug).maybeSingle();
    if (existing) categoryId = existing.id;
    else {
      const { data: created, error } = await supabase.from("categories").insert({ name: v.new_category, slug }).select("id").single();
      if (error || !created) return { ok: false, error: "Could not create the category." };
      categoryId = created.id;
    }
  }

  let oldImage: string | null = null;
  let oldSlug: string | null = null;
  if (id) {
    const { data: old } = await supabase.from("products").select("image_path,slug").eq("id", id).maybeSingle();
    oldImage = old?.image_path ?? null;
    oldSlug = old?.slug ?? null;
  }

  const { variants, new_category: _nc, ...product } = v;
  void _nc;
  const { data, error } = await supabase.rpc("admin_save_product", {
    p_id: id ?? null,
    p_product: { ...product, category_id: categoryId },
    p_variants: variants,
  });

  if (error) {
    if (error.code === "23505") {
      if (error.message.includes("slug")) return { ok: false, error: "That URL slug is already used by another product.", field: "slug" };
      if (error.message.includes("sku")) return { ok: false, error: "One of the SKUs is already in use." };
      return { ok: false, error: "Each pack size can only be added once per product." };
    }
    console.error("admin_save_product failed:", error.message);
    return { ok: false, error: "We couldn't save the product. Please try again." };
  }

  if (oldImage && oldImage !== (v.image_path || null)) await removeImage(oldImage);
  refresh(v.slug, oldSlug);
  return { ok: true, id: data as string };
}

export async function setPublished(id: string, published: boolean): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "You are not authorised to do this." };
  const { data, error } = await admin.supabase.from("products").update({ is_active: published, updated_at: new Date().toISOString() }).eq("id", id).select("slug").maybeSingle();
  if (error || !data) return { ok: false, error: "Couldn't update the product." };
  refresh(data.slug);
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "You are not authorised to do this." };
  const { data: p } = await admin.supabase.from("products").select("slug,image_path").eq("id", id).maybeSingle();
  const { error } = await admin.supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: "Couldn't delete the product." };
  await removeImage(p?.image_path);
  refresh(p?.slug);
  return { ok: true };
}
