import type { Metadata } from "next";
import { PageShell } from "@/components/shell/PageShell";
import { SITE, getWhatsAppNumber } from "@/lib/site";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  const wa = getWhatsAppNumber();
  return (
    <PageShell title="Contact">
      <p>Questions about an order or our spices? Reach out using the details below.</p>
      <dl className="card space-y-3 p-5 text-sm">
        <div><dt className="font-medium text-foreground">Phone</dt><dd>{SITE.phone}</dd></div>
        <div><dt className="font-medium text-foreground">Email</dt><dd>{SITE.email}</dd></div>
        <div><dt className="font-medium text-foreground">Address</dt><dd>{SITE.address}</dd></div>
      </dl>
      {wa && (
        <a className="btn btn-primary" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">
          Chat on WhatsApp
        </a>
      )}
    </PageShell>
  );
}
