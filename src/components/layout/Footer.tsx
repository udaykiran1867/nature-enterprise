import Link from "next/link";
import { cacheLife } from "next/cache";
import { MessageCircle } from "lucide-react";
import { Logo } from "./Logo";
import { SITE } from "@/lib/site";
import { getPublicSettings, resolveWhatsAppNumber } from "@/services/settings";

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

const link = "block w-fit text-ivory/80 underline-offset-4 hover:text-white hover:underline";
const h = "mb-4 font-sans text-xs font-semibold uppercase tracking-[0.18em] !text-ivory/60";

export async function Footer() {
  const [{ business }, wa] = await Promise.all([getPublicSettings(), resolveWhatsAppNumber()]);
  return (
    <footer className="mt-20 bg-forest-dark text-ivory">
      <div className="container-page">
        <div className="-translate-y-1/2 rounded-2xl bg-terracotta px-5 py-6 sm:px-8 sm:py-7 text-white shadow-lg md:flex md:items-center md:justify-between md:px-10">
          <div>
            <p className="font-display text-2xl sm:text-3xl !text-white">Ready to stock your kitchen?</p>
            <p className="mt-1 text-sm sm:text-base text-white/85">Pick your spices and send the order straight to us on WhatsApp.</p>
          </div>
          <Link href="/products" className="btn mt-4 w-full sm:w-auto bg-white text-terracotta-dark hover:bg-ivory md:mt-0 font-semibold">Shop all spices</Link>
        </div>
      </div>
      <div className="container-page grid grid-cols-2 gap-8 pb-12 sm:gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="col-span-2 md:col-span-1 space-y-3 sm:space-y-4">
          <Logo light />
          <p className="max-w-xs text-sm text-ivory/75">{SITE.description}</p>
        </div>
        <nav aria-label="Shop" className="col-span-1 space-y-2 sm:space-y-2.5 text-sm">
          <h2 className={h}>Shop</h2>
          <Link className={link} href="/products">All spices</Link>
          <Link className={link} href="/products?featured=1">Bestsellers</Link>
          <Link className={link} href="/cart">Cart</Link>
        </nav>
        <nav aria-label="Company" className="col-span-1 space-y-2 sm:space-y-2.5 text-sm">
          <h2 className={h}>Company</h2>
          <Link className={link} href="/about">About us</Link>
          <Link className={link} href="/contact">Contact</Link>
          <Link className={link} href="/privacy">Privacy Policy</Link>
          <Link className={link} href="/terms">Terms &amp; Conditions</Link>
          <Link className={link} href="/returns">Returns &amp; Cancellation</Link>
        </nav>
        <div className="col-span-2 md:col-span-1 space-y-2 sm:space-y-2.5 text-sm text-ivory/80">
          <h2 className={h}>Contact</h2>
          <p>{business.phone || SITE.phone}</p>
          <p>{business.email || SITE.email}</p>
          <p>{business.address || SITE.address}</p>
          {wa && (
            <a className="mt-3 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-white/25 px-4 py-2.5 text-sm text-ivory hover:bg-white/10 transition-colors" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" aria-hidden /> Chat on WhatsApp
            </a>
          )}
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="container-page py-5 text-xs text-ivory/60">&copy; <CopyrightYear /> {SITE.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}
