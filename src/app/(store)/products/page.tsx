import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { ProductGrid, ProductGridSkeleton } from "@/components/products/ProductGrid";
import { PageBanner } from "@/components/shell/PageBanner";
import { Pagination } from "@/components/shell/Pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { sortProducts, type SortKey } from "@/lib/products";
import { getCategories, getProducts } from "@/services/products";

export const metadata: Metadata = {
  title: "Shop Spices",
  description: "Browse homemade masalas and spice powders by category and pack size.",
  alternates: { canonical: "/products" },
};

const PAGE_SIZE = 12;
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
  const wanted = Math.max(1, parseInt(one(sp.page)) || 1);

  const [categories, found] = await Promise.all([
    getCategories(),
    getProducts({ q: q || undefined, category: category || undefined, featured }),
  ]);
  const sorted = sortProducts(found, sort);
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(wanted, pages);
  const products = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const filtered = Boolean(q || category || featured);
  const base = { ...(q && { q }), ...(category && { category }), ...(sort !== "name" && { sort }), ...(featured && { featured: "1" }) };
  const hrefFor = (p: number) => `/products?${new URLSearchParams({ ...base, ...(p > 1 && { page: String(p) }) })}`;

  return (
    <>
      <div className="flex flex-wrap gap-2" aria-label="Categories">
        {[{ id: "", slug: "", name: "All" }, ...categories].map((c) => (
          <Link key={c.id || "all"} href={`/products?${new URLSearchParams({ ...(q && { q }), ...(c.slug && { category: c.slug }), ...(sort !== "name" && { sort }), ...(featured && { featured: "1" }) })}`}
            className={`chip ${category === c.slug ? "chip-active" : ""}`} aria-current={category === c.slug ? "true" : undefined}>{c.name}</Link>
        ))}
      </div>

      <form role="search" className="mt-4 flex flex-col gap-3 md:flex-row">
        {featured && <input type="hidden" name="featured" value="1" />}
        {category && <input type="hidden" name="category" value={category} />}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Search for your favorite spices…" aria-label="Search products" className="field h-12 rounded-xl pl-10" />
        </div>
        <select name="sort" defaultValue={sort} aria-label="Sort by" className="field h-12 rounded-xl md:w-52">
          <option value="name">Sort by: Name (A–Z)</option>
          <option value="price-asc">Sort by: Price, low to high</option>
          <option value="price-desc">Sort by: Price, high to low</option>
        </select>
        <button className="btn btn-primary h-12 rounded-xl px-7">Search</button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground" role="status">
        <span>{sorted.length} product{sorted.length === 1 ? "" : "s"}{featured ? " in Bestsellers" : ""}</span>
        <span className="hidden items-center gap-3 sm:inline-flex">Explore our products <span className="h-px w-12 bg-terracotta/50" aria-hidden /></span>
      </div>
      <div className="mt-4">
        {products.length ? (
          <>
            <ProductGrid products={products} />
            <Pagination page={page} pages={pages} total={sorted.length} pageSize={PAGE_SIZE} noun="products" hrefFor={hrefFor} />
          </>
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
    <>
      <PageBanner eyebrow="Discover our collection" title="Our Spices" description="Choose your pack size, add to cart, and send your order on WhatsApp." />
      <div className="container-page py-8 md:py-10">
        <Suspense fallback={<><Skeleton className="h-12 w-full" /><div className="mt-10"><ProductGridSkeleton /></div></>}>
          <Results searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
