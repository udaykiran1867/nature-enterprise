import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";

/** The brand mark. `plate` puts it on an ivory tile so it stays readable on dark backgrounds. */
export function LogoMark({ className = "h-9 w-auto", plate = false, priority = false }: { className?: string; plate?: boolean; priority?: boolean }) {
  const img = <Image src="/logo.png" alt="" width={720} height={770} priority={priority} className={className} />;
  return plate ? <span className="inline-flex items-center rounded-lg bg-ivory p-1.5">{img}</span> : img;
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5" aria-label={`${SITE.name} home`}>
      <LogoMark plate={light} priority={!light} className={light ? "h-10 w-auto" : "h-11 w-auto"} />
      <span className={`font-display text-lg font-semibold leading-none tracking-tight sm:text-2xl ${light ? "text-ivory" : "text-forest-dark"}`}>
        {SITE.name}
      </span>
    </Link>
  );
}
