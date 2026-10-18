"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/site";

export function NavLinks() {
  const pathname = usePathname();

  return (
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
  );
}

export function NavLinksFallback() {
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
      {NAV.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="relative px-3 py-2 text-sm font-medium text-forest-dark transition-colors after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:scale-x-0 after:rounded-full after:bg-forest hover:text-forest hover:after:scale-x-100"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

