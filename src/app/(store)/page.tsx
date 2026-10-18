import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { MessageCircle, Package, UserX } from "lucide-react";
import { ProductGrid, ProductGridSkeleton } from "@/components/products/ProductGrid";
import { SITE } from "@/lib/site";
import { getProducts } from "@/services/products";

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-forest text-ivory">
      {SITE.heroImage && (
        <>
          <Image src={SITE.heroImage} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
          <div className="absolute inset-0 -z-10 bg-forest-dark/70" />
        </>
      )}
      <div className="grain absolute inset-0 -z-10 opacity-60" aria-hidden />
      <div className="pointer-events-none absolute -right-32 -top-32 -z-10 size-[26rem] rounded-full border border-white/10" aria-hidden />
      <div className="container-page py-14 md:py-24">
        <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-ivory/70"><span className="h-px w-8 bg-terracotta" />{SITE.tagline}</p>
        <h1 className="max-w-2xl text-5xl leading-[1.05] !text-ivory md:text-7xl">Bring Home the Taste of Nature</h1>
        <p className="mt-5 max-w-xl text-base text-ivory/85 md:text-lg">
          Homemade masalas and spice powders from Tulunad, in pack sizes that suit your kitchen. Pick what you need and send your order straight to us on WhatsApp.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/products" className="btn btn-accent h-12 px-7 text-base">Explore Our Spices</Link>
          <Link href="/products?featured=1" className="btn btn-light h-12 px-7 text-base">Shop Bestsellers</Link>
        </div>
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

      <section className="container-page pt-14 md:pt-20">
        <div className="flex items-end justify-between gap-4">
          <div><p className="eyebrow">Handpicked</p><h2 className="text-4xl md:text-5xl">Featured products</h2></div>
          <Link href="/products" className="text-sm font-medium text-forest underline-offset-4 hover:underline">View all</Link>
        </div>
        <div className="mt-6">
          <Suspense fallback={<ProductGridSkeleton count={4} />}>
            <Featured />
          </Suspense>
        </div>
      </section>

      <section className="container-page pt-14 md:pt-20" aria-labelledby="how-heading">
        <p className="eyebrow">Why order here</p>
        <h2 id="how-heading" className="text-4xl md:text-5xl">Simple, direct ordering</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="card flex gap-4 p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sage text-forest"><Icon className="size-5" aria-hidden /></span>
              <div><h3 className="font-sans text-base font-semibold text-foreground">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{text}</p></div>
            </li>
          ))}
        </ul>
      </section>

      <section className="pattern-leaf mt-16 md:mt-24">
        <div className="container-page grid items-center gap-10 py-16 md:grid-cols-2 md:py-20">
          <div>
            <p className="eyebrow">Our story</p>
            <h2 className="text-4xl md:text-5xl">Rooted in the flavours of Tulunad</h2>
            <p className="mt-4 text-muted-foreground">We celebrate the rich flavours and culinary traditions of Tulunad with homemade masalas and spice powders that bring authentic taste to your everyday cooking, from traditional curries to chicken and fish dishes.</p>
            <div className="mt-7 flex flex-wrap gap-3"><Link href="/about" className="btn btn-primary">Read our story</Link><Link href="/products" className="btn btn-outline">Browse the catalogue</Link></div>
          </div>
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl border-2 border-terracotta" aria-hidden />
            <div className="relative rounded-2xl bg-forest p-8 text-ivory">
              <p className="font-display text-3xl leading-snug !text-ivory">&ldquo;Made in Tulunad, Inspired by Tradition.&rdquo;</p>
              <p className="mt-4 text-sm text-ivory/70">{SITE.name}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
