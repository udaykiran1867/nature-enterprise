import Image from "next/image";

export function PageBanner({ eyebrow, title, description, tall = false }: { eyebrow: string; title: string; description?: string; tall?: boolean }) {
  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-[#e4ecd8]">
      <Image src="/banner-spices.jpg" alt="" fill priority sizes="100vw" className="-z-20 object-cover object-right" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#e4ecd8]/95 via-[#e4ecd8]/85 to-transparent sm:from-[#e4ecd8] sm:via-[#e4ecd8]/80 md:from-transparent md:via-transparent" aria-hidden />
      <div className={`container-page ${tall ? "py-10 sm:py-14 md:py-20" : "py-8 sm:py-10 md:py-12"}`}>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="max-w-xl text-3xl sm:text-4xl md:text-6xl leading-[1.08] sm:leading-[1.05]">{title}</h1>
        {description && <p className="mt-2.5 sm:mt-3 max-w-lg text-sm sm:text-base text-muted-foreground md:text-lg">{description}</p>}
      </div>
    </section>
  );
}
