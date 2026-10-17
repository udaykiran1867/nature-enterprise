import { z } from "zod";

export const UNITS = ["g", "kg", "ml", "l", "pcs"] as const;

export const variantSchema = z.object({
  id: z.string().optional(),
  pack_size: z.number({ message: "Enter a size" }).positive("Must be above 0").max(100000),
  unit: z.enum(UNITS),
  sku: z.string().trim().max(40),
  price: z.number({ message: "Enter a price" }).positive("Must be above 0").max(1000000),
  stock_quantity: z.number({ message: "Enter stock" }).int("Whole numbers only").min(0).max(1000000),
  low_stock_threshold: z.number({ message: "Required" }).int().min(0).max(100000),
  is_available: z.boolean(),
});

export const IMAGE_PATH_RE = /^products\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

export const productSchema = z.object({
  name: z.string().trim().min(2, "Enter a product name").max(120),
  slug: z.string().trim().min(2, "Enter a slug").max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens"),
  description: z.string().trim().max(2000),
  category_id: z.string(),
  new_category: z.string().trim().max(60),
  image_path: z.string().refine((v) => v === "" || IMAGE_PATH_RE.test(v), "Invalid image"),
  image_alt: z.string().trim().max(160),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  seo_title: z.string().trim().max(70),
  seo_description: z.string().trim().max(170),
  variants: z.array(variantSchema).min(1, "Add at least one pack size").max(12),
}).superRefine((v, ctx) => {
  if (v.category_id === "__new__" && v.new_category.length < 2)
    ctx.addIssue({ code: "custom", path: ["new_category"], message: "Enter a category name" });
  const seen = new Set<string>();
  v.variants.forEach((x, i) => {
    const k = `${x.pack_size}-${x.unit}`;
    if (seen.has(k)) ctx.addIssue({ code: "custom", path: ["variants", i, "pack_size"], message: "Duplicate pack size" });
    seen.add(k);
  });
});
export type ProductFormValues = z.infer<typeof productSchema>;
