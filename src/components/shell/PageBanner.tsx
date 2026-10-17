import Image from "next/image";

export function PageBanner({ eyebrow, title, description, tall = false }: { eyebrow: string; title: string; description?: string; tall?: boolean }) {
  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-[#e4ecd8]">
      <Image src="/banner-spices.jpg" alt="" fill priority sizes="100vw" className="-z-20 object-cover object-right" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#e4ecd8] via-[#e4ecd8]/80 to-transparent md:from-transparent md:via-transparent" aria-hidden />
      <div className={`container-page ${tall ? "py-14 md:py-20" : "py-10 md:py-12"}`}>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="max-w-xl text-5xl leading-[1.05] md:text-6xl">{title}</h1>
        {description && <p className="mt-3 max-w-lg text-muted-foreground md:text-lg">{description}</p>}
      </div>
    </section>
  );
}
