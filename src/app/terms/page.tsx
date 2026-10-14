import type { Metadata } from "next";
import { PageShell, Placeholder } from "@/components/shell/PageShell";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function Page() {
  return (
    <PageShell title="Terms & Conditions">
      <Placeholder>[Placeholder: this policy will be published once the business owner provides the approved text.]</Placeholder>
    </PageShell>
  );
}
