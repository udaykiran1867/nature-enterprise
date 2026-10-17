"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "./ImageUploader";
import { saveProduct } from "@/app/admin/(panel)/products/actions";
import { slugify } from "@/lib/slug";
import { UNITS, productSchema, type ProductFormValues } from "@/schemas/product";

type Props = { categories: { id: string; name: string }[]; productId?: string; initial?: ProductFormValues; defaultLowStock?: number };

const EMPTY_VARIANT = { pack_size: 100, unit: "g" as const, sku: "", price: 0, stock_quantity: 0, low_stock_threshold: 5, is_available: true };
const EMPTY: ProductFormValues = {
  name: "", slug: "", description: "", category_id: "", new_category: "", image_path: "", image_alt: "",
  is_active: false, is_featured: false, seo_title: "", seo_description: "", variants: [EMPTY_VARIANT],
};

function Err({ msg }: { msg?: string }) {
  return msg ? <p role="alert" className="mt-1 text-sm text-destructive">{msg}</p> : null;
}
const Label = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
  <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-foreground">{children}</label>
);

export function ProductForm({ categories, productId, initial, defaultLowStock = 5 }: Props) {
  const newVariant = { ...EMPTY_VARIANT, low_stock_threshold: defaultLowStock };
  const router = useRouter();
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, control, handleSubmit, setValue, setError, formState: { errors, isSubmitting } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initial ?? { ...EMPTY, variants: [newVariant] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "variants", keyName: "_key" });
  const categoryId = useWatch({ control, name: "category_id" });
  const image = useWatch({ control, name: "image_path" });

  async function onSubmit(values: ProductFormValues) {
    setServerError(null);
    try {
      const res = await saveProduct(values, productId);
      if (!res.ok) {
        if (res.field === "slug") setError("slug", { message: res.error });
        setServerError(res.error);
        return;
      }
      toast.success(productId ? "Product updated" : "Product created");
      router.push("/admin/products");
      router.refresh();
    } catch {
      setServerError("Couldn't reach the server. Please try again.");
    }
  }

  const nameReg = register("name");

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="card space-y-5 p-5 sm:p-6">
          <h2 className="text-2xl">Details</h2>
          <div>
            <Label htmlFor="name">Product name</Label>
            <input id="name" className="field" {...nameReg}
              onChange={(e) => { nameReg.onChange(e); if (!slugTouched) setValue("slug", slugify(e.target.value), { shouldValidate: false }); }} />
            <Err msg={errors.name?.message} />
          </div>
          <div>
            <Label htmlFor="slug">URL slug</Label>
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-muted-foreground sm:inline">/products/</span>
              <input id="slug" className="field" {...register("slug", { onChange: () => setSlugTouched(true) })} />
            </div>
            <Err msg={errors.slug?.message} />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea id="description" rows={4} className="field h-auto py-2.5" {...register("description")} />
            <Err msg={errors.description?.message} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="category_id">Category</Label>
              <select id="category_id" className="field" {...register("category_id")}>
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="__new__">+ Create new category…</option>
              </select>
            </div>
            {categoryId === "__new__" && (
              <div>
                <Label htmlFor="new_category">New category name</Label>
                <input id="new_category" className="field" {...register("new_category")} />
                <Err msg={errors.new_category?.message} />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="size-4 accent-[#244B35]" {...register("is_active")} /> Published (visible in the store)</label>
            <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="size-4 accent-[#244B35]" {...register("is_featured")} /> Featured on homepage</label>
          </div>
        </section>

        <section className="card h-fit space-y-4 p-5 sm:p-6">
          <h2 className="text-2xl">Main image</h2>
          <ImageUploader value={image} onChange={(p) => setValue("image_path", p, { shouldDirty: true })} />
          <div>
            <Label htmlFor="image_alt">Image description (alt text)</Label>
            <input id="image_alt" className="field" placeholder="e.g. Turmeric powder in a bowl" {...register("image_alt")} />
          </div>
        </section>
      </div>

      <section className="card space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="text-2xl">Pack sizes</h2><p className="text-sm text-muted-foreground">Each size has its own price and stock.</p></div>
          <button type="button" className="btn btn-outline" onClick={() => append(newVariant)}><Plus className="size-4" aria-hidden /> Add size</button>
        </div>
        <Err msg={errors.variants?.root?.message ?? errors.variants?.message} />

        <ul className="space-y-3">
          {fields.map((f, i) => {
            const e = errors.variants?.[i];
            const n = (k: string) => `variants.${i}.${k}` as `variants.${number}.pack_size`;
            return (
              <li key={f._key} className="rounded-xl border border-border bg-background p-4">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                  <div><Label htmlFor={n("pack_size")}>Size</Label><input id={n("pack_size")} type="number" step="any" inputMode="decimal" className="field" {...register(n("pack_size"), { valueAsNumber: true })} /><Err msg={e?.pack_size?.message} /></div>
                  <div><Label htmlFor={n("unit")}>Unit</Label>
                    <select id={n("unit")} className="field" {...register(`variants.${i}.unit`)}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select></div>
                  <div><Label htmlFor={n("price")}>Price (₹)</Label><input id={n("price")} type="number" step="0.01" inputMode="decimal" className="field" {...register(`variants.${i}.price`, { valueAsNumber: true })} /><Err msg={e?.price?.message} /></div>
                  <div><Label htmlFor={n("stock")}>Stock</Label><input id={n("stock")} type="number" inputMode="numeric" className="field" {...register(`variants.${i}.stock_quantity`, { valueAsNumber: true })} /><Err msg={e?.stock_quantity?.message} /></div>
                  <div><Label htmlFor={n("low")}>Low-stock alert</Label><input id={n("low")} type="number" inputMode="numeric" className="field" {...register(`variants.${i}.low_stock_threshold`, { valueAsNumber: true })} /><Err msg={e?.low_stock_threshold?.message} /></div>
                  <div><Label htmlFor={n("sku")}>SKU (optional)</Label><input id={n("sku")} className="field" {...register(`variants.${i}.sku`)} /></div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[#244B35]" {...register(`variants.${i}.is_available`)} /> Available for sale</label>
                  <button type="button" onClick={() => remove(i)} disabled={fields.length === 1} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:text-destructive disabled:opacity-40">
                    <Trash2 className="size-4" aria-hidden /> Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <details className="card p-5 sm:p-6">
        <summary className="cursor-pointer text-sm font-semibold text-forest-dark">SEO (optional)</summary>
        <div className="mt-4 space-y-4">
          <div><Label htmlFor="seo_title">SEO title</Label><input id="seo_title" className="field" {...register("seo_title")} /><Err msg={errors.seo_title?.message} /></div>
          <div><Label htmlFor="seo_description">SEO description</Label><textarea id="seo_description" rows={2} className="field h-auto py-2.5" {...register("seo_description")} /><Err msg={errors.seo_description?.message} /></div>
        </div>
      </details>

      {serverError && (
        <div role="alert" className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> <p>{serverError}</p>
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t border-border bg-background/95 px-4 py-3 sm:mx-0 sm:rounded-xl sm:border">
        <Link href="/admin/products" className="btn btn-outline">Cancel</Link>
        <button type="submit" disabled={isSubmitting} className="btn btn-primary">
          {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />} {productId ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}
