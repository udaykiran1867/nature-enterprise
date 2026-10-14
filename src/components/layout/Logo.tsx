import Link from "next/link";
import { Leaf } from "lucide-react";
import { SITE } from "@/lib/site";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2" aria-label={`${SITE.name} home`}>
      <span className={`inline-flex size-8 items-center justify-center rounded-full ${light ? "bg-ivory text-forest" : "bg-forest text-ivory"}`}>
        <Leaf className="size-4" aria-hidden />
      </span>
      <span className={`font-display text-xl font-semibold tracking-tight ${light ? "text-ivory" : "text-forest-dark"}`}>
        {SITE.name}
      </span>
    </Link>
  );
}
