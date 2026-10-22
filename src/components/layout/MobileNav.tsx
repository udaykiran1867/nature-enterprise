"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Lock, MenuIcon } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LogoMark } from "@/components/layout/Logo";
import { NAV, SITE } from "@/lib/site";

function MobileNavLinks() {
  const pathname = usePathname();

  return (
    <nav aria-label="Mobile" className="flex flex-col gap-1.5 p-4 mt-2">
      {NAV.map((l) => {
        const isActive = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <SheetClose
            key={l.href}
            nativeButton={false}
            render={<Link href={l.href} />}
            className={`rounded-xl px-4 py-3 text-base font-medium transition-colors ${
              isActive
                ? "bg-forest text-ivory font-semibold shadow-sm"
                : "text-forest-dark hover:bg-secondary"
            }`}
          >
            {l.label}
          </SheetClose>
        );
      })}
      <div className="my-2 border-t border-border/60" />
      <SheetClose
        nativeButton={false}
        render={<Link href="/admin/login" />}
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-forest"
      >
        <Lock className="size-3.5" aria-hidden />
        Admin Login
      </SheetClose>
    </nav>
  );
}

function MobileNavLinksFallback() {
  return (
    <nav aria-label="Mobile" className="flex flex-col gap-1.5 p-4 mt-2">
      {NAV.map((l) => (
        <SheetClose
          key={l.href}
          nativeButton={false}
          render={<Link href={l.href} />}
          className="rounded-xl px-4 py-3 text-base font-medium text-forest-dark hover:bg-secondary"
        >
          {l.label}
        </SheetClose>
      ))}
      <div className="my-2 border-t border-border/60" />
      <SheetClose
        nativeButton={false}
        render={<Link href="/admin/login" />}
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-forest"
      >
        <Lock className="size-3.5" aria-hidden />
        Admin Login
      </SheetClose>
    </nav>
  );
}

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger className="icon-btn md:hidden" aria-label="Open menu">
        <MenuIcon className="size-5" aria-hidden />
      </SheetTrigger>
      <SheetContent>
        <div className="flex items-center gap-2.5 px-4 pt-4">
          <LogoMark className="h-8 w-auto" />
          <SheetTitle className="font-display text-xl font-semibold text-forest-dark">{SITE.name}</SheetTitle>
        </div>
        <Suspense fallback={<MobileNavLinksFallback />}>
          <MobileNavLinks />
        </Suspense>
      </SheetContent>
    </Sheet>
  );
}
