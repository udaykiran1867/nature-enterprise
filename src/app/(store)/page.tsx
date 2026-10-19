import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Allura } from "next/font/google";
import { ArrowRight, Leaf, MessageCircle, Package, ShoppingCart, UserX } from "lucide-react";
import { ProductGrid, ProductGridSkeleton } from "@/components/products/ProductGrid";
import { SITE } from "@/lib/site";
import { getProducts } from "@/services/products";

const script = Allura({ subsets: ["latin"], weight: "400", display: "swap" });

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-forest-dark text-ivory">
      <Image src="/hero-spices.jpg" alt="" fill priority sizes="100vw" className="-z-30 object-cover object-[70%_center] md:object-center" />
      <div className="absolute inset-0 -z-20 bg-gradient-to-r from-forest-dark/95 via-forest-dark/80 to-forest-dark/60 md:from-forest-dark/70 md:via-forest-dark/20 md:to-transparent" aria-hidden />
      <div className="absolute inset-0 -z-20 bg-black/20 md:hidden" aria-hidden />

      <div className="pointer-events-none absolute right-[4%] top-[12%] hidden size-36 items-center justify-center rounded-full border border-[#e8d9a8]/60 lg:flex" aria-hidden>
        <div className="flex size-[8.4rem] flex-col items-center justify-center gap-1 rounded-full border border-[#e8d9a8]/40 text-center font-display text-[0.8rem] font-semibold uppercase leading-snug tracking-[0.18em] text-[#f1e6bd]">
          <Leaf className="mb-1 size-6" />
          <span>· Pure ·</span><span>Natural ·</span><span>Authentic</span>
        </div>
      </div>

      <div className="container-page flex min-h-[26rem] flex-col justify-center py-12 sm:min-h-[32rem] sm:py-16 md:min-h-[38rem] md:py-24">
        <h1 className="max-w-2xl text-3xl xs:text-4xl sm:text-5xl md:text-7xl leading-[1.08] sm:leading-[1.05] !text-ivory drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
          <span className={`${script.className} inline-block -rotate-2 text-[1.25em] font-normal leading-none text-[#7cc04a]`}>Nature Home Made Products</span>
        </h1>
        <br />
        <p className="mb-4 inline-flex items-center gap-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-[0.16em] sm:tracking-[0.22em] text-ivory">
          <Leaf className="size-4 sm:size-5 text-[#8bc34a]" /><span className="h-px w-8 sm:w-10 bg-[#8bc34a]" />{SITE.tagline}
        </p>
        <p className="mt-4 sm:mt-6 max-w-xl text-sm sm:text-base leading-relaxed text-ivory/95 md:text-lg">
          The taste of Mothers Hand.
          A taste that takes you back home, to the warmth of family and the love in every meal.Made with love. Made to feel like home.
        </p>
        <div className="mt-6 sm:mt-8 flex flex-wrap gap-3">
          <Link href="/products" className="inline-flex h-12 w-full sm:w-auto justify-center items-center gap-2 rounded-full bg-[#c4552b] px-7 text-sm sm:text-base font-semibold text-white shadow-lg shadow-black/30 transition hover:-translate-y-0.5 hover:bg-[#a94623]">
            <Leaf className="size-4" />Explore Our Products<ArrowRight className="size-4" />
          </Link>
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

      <section className="container-page pt-10 sm:pt-14 md:pt-20">
        <div className="flex items-end justify-between gap-4">
          <div><p className="eyebrow">Handpicked</p><h2 className="text-3xl sm:text-4xl md:text-5xl">Featured products</h2></div>
          <Link href="/products" className="text-sm font-medium text-forest underline-offset-4 hover:underline shrink-0">View all</Link>
        </div>
        <div className="mt-6">
          <Suspense fallback={<ProductGridSkeleton count={4} />}>
            <Featured />
          </Suspense>
        </div>
      </section>

      <section className="container-page pt-12 sm:pt-14 md:pt-20" aria-labelledby="how-heading">
        <p className="eyebrow">Why order here</p>
        <h2 id="how-heading" className="text-3xl sm:text-4xl md:text-5xl">Simple, direct ordering</h2>
        <ul className="mt-6 grid gap-3.5 sm:gap-4 md:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="card flex items-start gap-4 p-4 sm:p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sage text-forest"><Icon className="size-5" aria-hidden /></span>
              <div><h3 className="font-sans text-base font-semibold text-foreground">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{text}</p></div>
            </li>
          ))}
        </ul>
      </section>

      <section className="pattern-leaf mt-14 sm:mt-16 md:mt-24 overflow-hidden">
        <div className="container-page grid items-center gap-8 py-12 sm:gap-10 sm:py-16 md:grid-cols-2 md:py-20">
          <div>
            <p className="eyebrow">Our story</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl">Rooted in the flavours of Tulunad</h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground">We celebrate the rich flavours and culinary traditions of Tulunad with homemade masalas and spice powders that bring authentic taste to your everyday cooking, from traditional curries to chicken and fish dishes.</p>
            <div className="mt-6 sm:mt-7 flex flex-col sm:flex-row gap-3">
              <Link href="/about" className="btn btn-primary w-full sm:w-auto text-center">Read our story</Link>
              <Link href="/products" className="btn btn-outline w-full sm:w-auto text-center">Browse the catalogue</Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-sm px-2 sm:px-0">
            <div className="absolute inset-0 translate-x-2 translate-y-2 sm:translate-x-3 sm:translate-y-3 rounded-2xl border-2 border-terracotta" aria-hidden />
            <div className="relative rounded-2xl bg-forest p-6 sm:p-8 text-ivory">
              <p className="font-display text-2xl sm:text-3xl leading-snug !text-ivory">&ldquo;Made in Tulunad, Inspired by Tradition.&rdquo;</p>
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-ivory/70">{SITE.name}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
