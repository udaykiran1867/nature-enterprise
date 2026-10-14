import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { ProductGrid, ProductGridSkeleton } from "@/components/products/ProductGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { sortProducts, type SortKey } from "@/lib/products";
import { getCategories, getProducts } from "@/services/products";

export const metadata: Metadata = {
  title: "Shop Spices",
  description: "Browse Indian masalas and spices by category and pack size.",
  alternates: { canonical: "/products" },
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

async function Results({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 60);
  const categoryRaw = one(sp.category);
  const category = /^[a-z0-9-]{1,80}$/.test(categoryRaw) ? categoryRaw : "";
  const sortRaw = one(sp.sort);
  const sort: SortKey = sortRaw === "price-asc" || sortRaw === "price-desc" ? sortRaw : "name";
  const featured = one(sp.featured) === "1";

  const [categories, found] = await Promise.all([
    getCategories(),
    getProducts({ q: q || undefined, category: category || undefined, featured }),
  ]);
  const products = sortProducts(found, sort);
  const filtered = Boolean(q || category || featured);

  return (
    <>
      <form role="search" className="flex flex-col gap-3 md:flex-row">
        {featured && <input type="hidden" name="featured" value="1" />}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Search spices" aria-label="Search products" className="field pl-9" />
        </div>
        <select name="category" defaultValue={category} aria-label="Category" className="field md:w-52">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <select name="sort" defaultValue={sort} aria-label="Sort by" className="field md:w-44">
          <option value="name">Name (A to Z)</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
        <button className="btn btn-primary">Apply</button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground" role="status">
        {products.length} product{products.length === 1 ? "" : "s"}{featured ? " in Bestsellers" : ""}
      </p>
      <div className="mt-4">
        {products.length ? (
          <ProductGrid products={products} />
        ) : (
          <div className="card p-10 text-center">
            <p className="font-medium text-foreground">{filtered ? "No products match your search." : "No products available yet."}</p>
            {filtered && <Link href="/products" className="btn btn-outline mt-4">Clear filters</Link>}
          </div>
        )}
      </div>
    </>
  );
}

export default function ProductsPage({ searchParams }: PageProps<"/products">) {
  return (
    <div className="container-page py-10 md:py-12">
      <h1 className="text-4xl">Our Spices</h1>
      <div className="mt-6">
        <Suspense
          fallback={<><Skeleton className="h-11 w-full" /><div className="mt-10"><ProductGridSkeleton /></div></>}
        >
          <Results searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
