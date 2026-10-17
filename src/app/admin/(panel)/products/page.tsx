import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { ProductRowActions } from "@/components/admin/ProductRowActions";
import { Pagination } from "@/components/shell/Pagination";
import { ProductImage } from "@/components/products/ProductImage";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Products" };
const PAGE_SIZE = 15;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function AdminProducts({ searchParams }: PageProps<"/admin/products">) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 60);
  const status = one(sp.status);
  const category = /^[0-9a-f-]{36}$/.test(one(sp.category)) ? one(sp.category) : "";
  const page = Math.max(1, parseInt(one(sp.page)) || 1);

  let query = supabase
    .from("products")
    .select("id,name,image_path,image_alt,is_active,is_featured,updated_at,category:categories(name),variants:product_variants(count)", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (q) query = query.ilike("name", `%${q.replace(/[%_,()]/g, " ")}%`);
  if (status === "published") query = query.eq("is_active", true);
  if (status === "draft") query = query.eq("is_active", false);
  if (category) query = query.eq("category_id", category);

  const [{ data, count, error }, { data: categories }] = await Promise.all([query, supabase.from("categories").select("id,name").order("name")]);
  const rows = (data ?? []) as unknown as { id: string; name: string; image_path: string | null; image_alt: string | null; is_active: boolean; is_featured: boolean; updated_at: string; category: { name: string } | null; variants: { count: number }[] }[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const link = (p: number) => `/admin/products?${new URLSearchParams({ ...(q && { q }), ...(status && { status }), ...(category && { category }), page: String(p) })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-4xl">Products</h1><p className="text-muted-foreground">{count ?? 0} in total</p></div>
        <Link href="/admin/products/new" className="btn btn-primary"><Plus className="size-4" aria-hidden /> Add Product</Link>
      </div>

      <form role="search" className="card flex flex-col gap-3 p-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Search products" aria-label="Search products" className="field pl-9" />
        </div>
        <select name="category" defaultValue={category} aria-label="Category" className="field md:w-48">
          <option value="">All categories</option>
          {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="status" defaultValue={status} aria-label="Status" className="field md:w-40">
          <option value="">Any status</option><option value="published">Published</option><option value="draft">Draft</option>
        </select>
        <button className="btn btn-outline">Filter</button>
      </form>

      {error ? (
        <div className="card p-10 text-center text-destructive">Couldn&apos;t load products. Please refresh.</div>
      ) : rows.length ? (
        <ul className="space-y-3">
          {rows.map((p) => (
            <li key={p.id} className="card flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:p-4">
              <div className="flex flex-1 items-center gap-4">
                <div className="w-16 shrink-0"><ProductImage path={p.image_path} alt={p.image_alt ?? p.name} sizes="64px" className="rounded-lg" /></div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{p.category?.name ?? "No category"} · {p.variants[0]?.count ?? 0} pack size{(p.variants[0]?.count ?? 0) === 1 ? "" : "s"}</p>
                  <p className="text-xs text-muted-foreground">Updated {new Date(p.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${p.is_active ? "badge-green" : "badge-gray"}`}>{p.is_active ? "Published" : "Draft"}</span>
                {p.is_featured && <span className="badge badge-amber">Featured</span>}
              </div>
              <ProductRowActions id={p.id} name={p.name} isActive={p.is_active} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="card p-12 text-center">
          <p className="font-medium">{q || status || category ? "No products match these filters." : "No products yet."}</p>
          <Link href="/admin/products/new" className="btn btn-primary mt-4">Add your first product</Link>
        </div>
      )}

      <Pagination page={page} pages={pages} total={count ?? 0} pageSize={PAGE_SIZE} noun="products" hrefFor={link} />
    </div>
  );
}
