import Link from "next/link";
import { cacheLife } from "next/cache";
import { Logo } from "./Logo";
import { SITE, getWhatsAppNumber } from "@/lib/site";

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

const col = "space-y-2 text-sm text-ivory/80";
const link = "hover:text-white hover:underline underline-offset-4";

export function Footer() {
  const wa = getWhatsAppNumber();
  return (
    <footer className="mt-16 bg-forest-dark text-ivory">
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        <div className="space-y-3 md:col-span-1">
          <Logo light />
          <p className="max-w-xs text-sm text-ivory/80">{SITE.description}</p>
        </div>
        <nav aria-label="Shop" className={col}>
          <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wide !text-ivory">Shop</h2>
          <Link className={`block ${link}`} href="/products">All spices</Link>
          <Link className={`block ${link}`} href="/products?featured=1">Bestsellers</Link>
          <Link className={`block ${link}`} href="/cart">Cart</Link>
        </nav>
        <nav aria-label="Company" className={col}>
          <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wide !text-ivory">Company</h2>
          <Link className={`block ${link}`} href="/about">About us</Link>
          <Link className={`block ${link}`} href="/contact">Contact</Link>
          <Link className={`block ${link}`} href="/privacy">Privacy Policy</Link>
          <Link className={`block ${link}`} href="/terms">Terms &amp; Conditions</Link>
          <Link className={`block ${link}`} href="/returns">Returns &amp; Cancellation</Link>
        </nav>
        <div className={col}>
          <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wide !text-ivory">Contact</h2>
          <p>{SITE.phone}</p>
          <p>{SITE.email}</p>
          <p>{SITE.address}</p>
          {wa && (
            <a className={`inline-block ${link}`} href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">
              Chat on WhatsApp
            </a>
          )}
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="container-page py-4 text-xs text-ivory/70">
          &copy; <CopyrightYear /> {SITE.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
