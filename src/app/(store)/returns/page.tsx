import type { Metadata } from "next";
import { PageShell, Placeholder } from "@/components/shell/PageShell";

export const metadata: Metadata = { title: "Returns, Refund & Cancellation" };

export default function Page() {
  return (
    <PageShell title="Returns, Refund & Cancellation">
      <Placeholder>[Placeholder: this policy will be published once the business owner provides the approved text.]</Placeholder>
    </PageShell>
  );
}
