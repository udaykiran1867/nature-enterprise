import Link from "next/link";
import { Suspense } from "react";
import { CartButton } from "./CartButton";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { NavLinks, NavLinksFallback } from "./NavLinks";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <Suspense fallback={<NavLinksFallback />}>
          <NavLinks />
        </Suspense>
        <div className="flex items-center gap-1">
          <Link href="/admin/login" className="hidden px-2 text-xs text-muted-foreground underline-offset-4 hover:text-forest hover:underline md:inline">
            Admin Login
          </Link>
          <CartButton />
          <Suspense fallback={<span className="icon-btn md:hidden" aria-hidden />}>
            <MobileNav />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
