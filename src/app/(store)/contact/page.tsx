import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/shell/ContactForm";
import { PageBanner } from "@/components/shell/PageBanner";
import { SITE } from "@/lib/site";
import { getPublicSettings, resolveWhatsAppNumber } from "@/services/settings";

export const metadata: Metadata = { title: "Contact", description: "Get in touch with Nature Enterprises.", alternates: { canonical: "/contact" } };

async function Aside() {
  const [{ business }, wa] = await Promise.all([getPublicSettings(), resolveWhatsAppNumber()]);
  const rows = [
    { icon: Phone, label: "Phone", value: business.phone || SITE.phone },
    { icon: Mail, label: "Email", value: business.email || SITE.email },
    { icon: MapPin, label: "Address", value: business.address || SITE.address },
  ];
  return (
    <aside className="space-y-6">
      <div className="relative aspect-[16/8] overflow-hidden rounded-2xl border border-border shadow-sm">
        <Image src="/contact-spices.jpg" alt="Bowls of freshly ground Indian spices" fill sizes="(min-width:1024px) 30vw, 100vw" className="object-cover" />
      </div>
      <dl className="space-y-5">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-sage text-forest"><Icon className="size-5" aria-hidden /></span>
            <div><dt className="font-semibold text-foreground">{label}</dt><dd className="mt-0.5 text-muted-foreground">{value}</dd></div>
          </div>
        ))}
      </dl>
      {wa && (
        <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
          className="group flex items-center gap-4 rounded-2xl border border-border bg-sage/70 p-3 pr-5 transition-colors hover:bg-sage">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-forest text-ivory"><MessageCircle className="size-6" aria-hidden /></span>
          <span className="flex-1"><span className="block font-semibold text-forest-dark">Chat on WhatsApp</span><span className="text-sm text-muted-foreground">Quick support, faster response.</span></span>
          <ArrowRight className="size-5 text-forest transition-transform group-hover:translate-x-1" aria-hidden />
        </a>
      )}
    </aside>
  );
}

export default function ContactPage() {
  return (
    <>
      <PageBanner tall eyebrow="Get in touch" title="We'd Love to Hear from You"
        description="Have a question, feedback, or need assistance? We're here to help. Reach out to us and we'd be happy to connect with you." />
      <div className="container-page grid gap-8 py-8 sm:py-10 md:py-14 lg:grid-cols-[1.35fr_1fr]">
        <section className="pattern-leaf relative h-fit overflow-hidden rounded-2xl border border-border p-5 sm:p-8">
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl md:text-4xl">Send us a Message</h2>
            <p className="mb-5 sm:mb-6 mt-1 text-sm text-muted-foreground">Fill out the form below and we&apos;ll get back to you as soon as possible.</p>
            <ContactForm />
          </div>
        </section>
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-sage" />}><Aside /></Suspense>
      </div>
    </>
  );
}
