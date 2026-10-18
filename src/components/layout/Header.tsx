"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CartButton } from "./CartButton";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { NAV } from "@/lib/site";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((l) => {
            const isActive = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative px-3 py-2 text-sm font-medium transition-colors
                  after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-forest after:transition-transform after:duration-200
                  ${isActive
                    ? "text-forest after:scale-x-100"
                    : "text-forest-dark after:scale-x-0 hover:text-forest hover:after:scale-x-100"
                  }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1">
          <Link href="/admin/login" className="hidden px-2 text-xs text-muted-foreground underline-offset-4 hover:text-forest hover:underline md:inline">
            Admin Login
          </Link>
          <CartButton />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
