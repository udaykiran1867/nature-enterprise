"use client";

import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NAV, SITE } from "@/lib/site";

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger className="icon-btn md:hidden" aria-label="Open menu">
        <MenuIcon className="size-5" aria-hidden />
      </SheetTrigger>
      <SheetContent>
        <SheetTitle className="px-4 pt-4 font-display text-xl text-forest-dark">{SITE.name}</SheetTitle>
        <nav aria-label="Mobile" className="flex flex-col gap-1 p-4">
          {NAV.map((l) => (
            <SheetClose
              key={l.href}
              render={<Link href={l.href} />}
              className="rounded-lg px-3 py-3 text-base font-medium text-forest-dark hover:bg-secondary"
            >
              {l.label}
            </SheetClose>
          ))}
          <SheetClose
            render={<Link href="/admin/login" />}
            className="mt-4 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"
          >
            Admin Login
          </SheetClose>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
