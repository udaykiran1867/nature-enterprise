import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { MessageCircle, Package, UserX } from "lucide-react";
import { ProductGrid, ProductGridSkeleton } from "@/components/products/ProductGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { SITE } from "@/lib/site";
import { getCategories, getProducts } from "@/services/products";

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-forest text-ivory">
      {SITE.heroImage && (
        <>
          <Image src={SITE.heroImage} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
          <div className="absolute inset-0 -z-10 bg-forest-dark/70" />
        </>
      )}
      <div className="container-page py-16 md:py-24">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-ivory/70">{SITE.tagline}</p>
        <h1 className="max-w-2xl text-4xl !text-ivory sm:text-5xl md:text-6xl">Bring Home the Taste of Nature</h1>
        <p className="mt-5 max-w-xl text-base text-ivory/85 md:text-lg">
          Masalas and spices in pack sizes that suit your kitchen. Pick what you need and send your order straight to us on WhatsApp.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/products" className="btn btn-accent">Explore Our Spices</Link>
          <Link href="/products?featured=1" className="btn btn-light">Shop Bestsellers</Link>
        </div>
      </div>
    </section>
  );
}

async function Categories() {
  const categories = await getCategories();
  if (!categories.length) return null;
  return (
    <section className="container-page pt-12 md:pt-16">
      <h2 className="text-3xl">Shop by category</h2>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {categories.map((c) => (
          <Link key={c.id} href={`/products?category=${c.slug}`}
            className="flex min-h-24 items-center justify-center rounded-xl bg-sage p-5 text-center font-medium text-forest-dark transition-colors hover:bg-forest hover:text-ivory">
            {c.name}
          </Link>
        ))}
      </div>
    </section>
  );
}

async function Featured() {
  const products = await getProducts({ featured: true, limit: 8 });
  return products.length ? (
    <ProductGrid products={products} />
  ) : (
    <p className="card p-8 text-center text-muted-foreground">Products are coming soon. Please check back shortly.</p>
  );
}

const BENEFITS = [
  { icon: UserX, title: "No account needed", text: "Browse and order without registering or logging in." },
  { icon: Package, title: "Pack sizes for every kitchen", text: "Choose the size that suits you, each with its own price." },
  { icon: MessageCircle, title: "Confirm on WhatsApp", text: "Your order opens in WhatsApp so you can send it to us directly." },
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense fallback={<div className="container-page pt-12"><Skeleton className="h-24 w-full" /></div>}>
        <Categories />
      </Suspense>

      <section className="container-page pt-12 md:pt-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl">Featured products</h2>
          <Link href="/products" className="text-sm font-medium text-forest underline-offset-4 hover:underline">View all</Link>
        </div>
        <div className="mt-6">
          <Suspense fallback={<ProductGridSkeleton count={4} />}>
            <Featured />
          </Suspense>
        </div>
      </section>

      <section className="container-page pt-12 md:pt-16" aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-3xl">Simple, direct ordering</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="card flex gap-4 p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sage text-forest"><Icon className="size-5" aria-hidden /></span>
              <div><h3 className="font-sans text-base font-semibold text-foreground">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{text}</p></div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 bg-sage md:mt-16">
        <div className="container-page max-w-3xl py-12 text-center">
          <h2 className="text-3xl">Our story</h2>
          <p className="mt-3 text-muted-foreground">[Placeholder: replace with the owner&apos;s verified brand story.]</p>
          <Link href="/products" className="btn btn-primary mt-6">Browse the full catalogue</Link>
        </div>
      </section>
    </>
  );
}
