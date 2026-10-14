import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductImage } from "@/components/products/ProductImage";
import { VariantPicker } from "@/components/products/VariantPicker";
import { Skeleton } from "@/components/ui/skeleton";
import { getProductBySlug, getProducts } from "@/services/products";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product not found", robots: { index: false } };
  return {
    title: p.name,
    description: p.description ?? undefined,
    alternates: { canonical: `/products/${p.slug}` },
  };
}

async function Related({ productId, category }: { productId: string; category: string }) {
  const related = await getProducts({ category, excludeId: productId, limit: 4 });
  if (!related.length) return null;
  return (
    <section className="mt-16">
      <h2 className="text-3xl">You may also like</h2>
      <div className="mt-6"><ProductGrid products={related} /></div>
    </section>
  );
}

async function Detail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/products" className="hover:text-forest hover:underline">Shop</Link>
        {product.category && (<> <span aria-hidden>/</span> <Link href={`/products?category=${product.category.slug}`} className="hover:text-forest hover:underline">{product.category.name}</Link></>)}
      </nav>
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <ProductImage
          path={product.image_path}
          alt={product.image_alt ?? product.name}
          sizes="(min-width:768px) 50vw, 100vw"
          priority
          className="rounded-xl border border-border"
        />
        <div className="space-y-5">
          {product.category && <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{product.category.name}</p>}
          <h1 className="text-4xl md:text-5xl">{product.name}</h1>
          {product.description && <p className="text-muted-foreground">{product.description}</p>}
          <hr className="border-border" />
          <VariantPicker
            key={product.id}
            product={{ id: product.id, slug: product.slug, name: product.name, image_path: product.image_path }}
            variants={product.variants}
          />
        </div>
      </div>
      {product.category && <Related productId={product.id} category={product.category.slug} />}
    </>
  );
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <div className="container-page py-8 md:py-12">
      <Suspense
        fallback={<div className="grid gap-8 md:grid-cols-2"><Skeleton className="aspect-square" /><div className="space-y-4"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-24 w-full" /></div></div>}
      >
        <Detail params={params} />
      </Suspense>
    </div>
  );
}
