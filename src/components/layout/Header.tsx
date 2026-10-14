import Link from "next/link";
import { CartButton } from "./CartButton";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { NAV } from "@/lib/site";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium text-forest-dark hover:bg-secondary">
              {l.label}
            </Link>
          ))}
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
