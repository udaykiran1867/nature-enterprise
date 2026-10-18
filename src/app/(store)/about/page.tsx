import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/layout/Logo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Us",
  description: "Nature Enterprises offers homemade masalas and spice powders from Tulunad, bringing authentic taste to everyday cooking.",
  alternates: { canonical: "/about" },
};

const RANGE = [
  "Nature Sukka Masala", "Pulimunchi Masala", "Rasam Powder", "Sambar Powder",
  "Kabab Powder", "Chicken Ghee Roast Masala", "Fish Fry Masala", "South Curry Chicken Masala",
];

export default function AboutPage() {
  return (
    <>
      <section className="pattern-leaf border-b border-border">
        <div className="container-page grid items-center gap-10 py-14 md:grid-cols-[1.4fr_1fr] md:py-20">
          <div>
            <p className="eyebrow">About us</p>
            <h1 className="text-3xl sm:text-5xl md:text-6xl leading-[1.08] sm:leading-[1.05]">{SITE.tagline}</h1>
            <div className="mt-5 sm:mt-6 max-w-xl space-y-4 text-sm sm:text-base text-muted-foreground md:text-lg">
              <p>At {SITE.name}, we celebrate the rich flavours and culinary traditions of Tulunad by offering a variety of homemade masalas and spice powders that bring authentic taste to your everyday cooking.</p>
              <p>From traditional curry preparations to delicious chicken and fish dishes, our range adds flavour to every meal.</p>
            </div>
          </div>
          <div className="mx-auto w-full max-w-xs rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            <LogoMark className="h-auto w-full" priority />
          </div>
        </div>
      </section>

      <section className="container-page py-10 sm:py-14 md:py-20">
        <p className="eyebrow">Our range</p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl">Flavours from our kitchen to yours</h2>
        <ul className="mt-6 sm:mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RANGE.map((name, i) => (
            <li key={name} className="card flex items-center gap-4 p-4">
              <span className="font-display text-2xl sm:text-3xl leading-none text-terracotta">{String(i + 1).padStart(2, "0")}</span>
              <span className="font-semibold text-sm sm:text-base text-forest-dark">{name}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-page pb-8 sm:pb-12">
        <div className="rounded-2xl bg-forest p-6 sm:p-8 md:p-12 text-center text-ivory">
          <p className="mx-auto max-w-2xl font-display text-2xl sm:text-3xl md:text-4xl leading-snug !text-ivory">We aim to bring the taste of tradition to your kitchen and make every meal a flavourful experience.</p>
          <p className="mt-3 sm:mt-4 text-xs sm:text-sm font-medium uppercase tracking-[0.18em] text-ivory/70">{SITE.name} · {SITE.tagline}</p>
          <Link href="/products" className="btn btn-accent mt-6 sm:mt-7 h-12 w-full sm:w-auto px-7 text-sm sm:text-base justify-center">Shop our spices <ArrowRight className="size-4" aria-hidden /></Link>
        </div>
      </section>
    </>
  );
}
