import type { Metadata } from "next";
import { Dancing_Script } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Leaf, Package, ShieldCheck, Sprout, Truck } from "lucide-react";
import { LoginForm } from "@/components/admin/LoginForm";
import { LogoMark } from "@/components/layout/Logo";

export const metadata: Metadata = { title: "Sign in" };

const script = Dancing_Script({ subsets: ["latin"], weight: ["500"], display: "swap" });

const FEATURES = [
  { icon: Leaf, label: "Natural", sub: "Products" },
  { icon: ShieldCheck, label: "Trusted", sub: "Supplier" },
  { icon: Truck, label: "On-Time", sub: "Delivery" },
  { icon: Package, label: "Wide", sub: "Range" },
];

function BrandRow({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-white p-2 shadow-lg shadow-black/10">
        <LogoMark className="h-full w-auto" priority />
      </span>
      <span className="font-sans text-xl font-semibold tracking-tight text-forest-dark">Nature Enterprises</span>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F6F8F2] lg:grid lg:grid-cols-[1.15fr_1fr]">
      {/* Mobile header */}
      <div className="relative h-56 overflow-hidden lg:hidden">
        <Image src="/login-bg.jpg" alt="" fill priority sizes="100vw" className="object-cover object-[20%_60%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/10 to-[#F6F8F2]" />
        <BrandRow className="relative p-5" />
      </div>

      {/* Desktop photo panel */}
      <aside className="relative hidden overflow-hidden lg:block">
        <Image src="/login-bg.jpg" alt="Turmeric, chilli, pepper and cardamom in wooden bowls against green hills at sunrise" fill priority sizes="55vw" className="object-cover object-left" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/10 to-transparent" aria-hidden />

        <div className="relative z-10 flex h-full flex-col p-10 xl:p-14">
          <BrandRow />
          <div className="mt-14 xl:mt-20">
            <p className="font-sans text-sm font-medium uppercase tracking-[0.3em] text-forest-dark/80">Welcome to</p>
            <h1 className="mt-2 max-w-xl font-sans text-5xl font-bold leading-[1.05] tracking-tight text-forest-dark xl:text-6xl">Nature Enterprises</h1>
            <p className="mt-5 max-w-sm text-lg leading-snug text-forest-dark/75">Premium quality products, straight from nature to your store.</p>
            <ul className="mt-8 flex gap-6">
              {FEATURES.map(({ icon: Icon, label, sub }) => (
                <li key={label} className="flex w-20 flex-col items-center text-center text-sm leading-tight text-forest-dark">
                  <span className="mb-2 flex size-12 items-center justify-center rounded-full bg-white/80 text-forest shadow-sm backdrop-blur-sm"><Icon className="size-5" aria-hidden /></span>
                  {label}<br />{sub}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 z-10 h-48 w-[62%] rounded-tr-[200px] bg-forest-dark/95 p-10 pt-12 xl:h-56">
          <p className={`${script.className} flex items-start gap-2 text-3xl leading-snug text-white xl:text-4xl`}>
            <span>Nature&apos;s goodness<br />for a healthier tomorrow</span>
            
          </p>
          <span className="mt-3 block h-0.5 w-40 rounded-full bg-gradient-to-r from-sage/80 to-transparent" aria-hidden />
        </div>

        {/* Wavy edge between photo and form */}
        <svg className="pointer-events-none absolute inset-y-0 -right-px z-20 h-full w-28" viewBox="0 0 100 1000" preserveAspectRatio="none" aria-hidden>
          <path d="M100 0H56C88 170 18 340 46 510C74 670 14 850 40 1000H100Z" fill="#F6F8F2" />
          <path d="M56 0C88 170 18 340 46 510C74 670 14 850 40 1000" fill="none" stroke="#3f8a5b" strokeOpacity=".55" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
      </aside>

      {/* Form panel */}
      <main className="relative z-10 -mt-12 flex items-center justify-center px-4 pb-12 lg:mt-0 lg:p-12">
        <p className="absolute right-8 top-7 hidden items-center gap-3 text-sm text-forest-dark/80 lg:flex">
          <Leaf className="size-5 text-forest" aria-hidden /> Quality <span aria-hidden>•</span> Trust <span aria-hidden>•</span> Growth
        </p>
        <Leaf className="pointer-events-none absolute -bottom-6 -right-6 hidden size-56 -rotate-[25deg] fill-forest/10 text-forest/20 lg:block" aria-hidden />

        <div className="relative w-full max-w-[26rem]">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white bg-white p-7 shadow-2xl shadow-forest/10 sm:p-9">
            <svg className="pointer-events-none absolute right-0 top-0 h-28 w-32" viewBox="0 0 128 112" aria-hidden>
              <defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3f8a5b" /><stop offset="1" stopColor="#1f5236" /></linearGradient></defs>
              <path d="M52 0H128V112C112 62 92 22 52 0Z" fill="url(#g1)" />
            </svg>
            <svg className="pointer-events-none absolute bottom-0 right-0 h-24 w-28" viewBox="0 0 112 96" aria-hidden>
              <path d="M112 0V96H40C86 82 108 50 112 0Z" fill="url(#g1)" />
            </svg>

            <div className="relative">
              <Sprout className="size-9 text-forest" aria-hidden />
              <h2 className="mt-1 font-sans text-3xl font-bold tracking-tight text-forest-dark">Admin <span className="text-[#2f7a4d]">Sign In</span></h2>
              <p className="mb-7 mt-2 text-[15px] leading-relaxed text-muted-foreground">Access your dashboard and manage your store with ease.</p>
              <LoginForm />
            </div>
          </div>
          <Link href="/" className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-forest-dark/80 transition-colors hover:text-forest">
            <ArrowLeft className="size-4" aria-hidden /> Back to store
          </Link>
        </div>
      </main>
    </div>
  );
}
