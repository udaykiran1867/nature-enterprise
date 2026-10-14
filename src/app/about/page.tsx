import type { Metadata } from "next";
import { PageShell, Placeholder } from "@/components/shell/PageShell";

export const metadata: Metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <PageShell title="About Us">
      <Placeholder>[Placeholder: replace with the owner&apos;s verified brand story, sourcing details and history.]</Placeholder>
    </PageShell>
  );
}
