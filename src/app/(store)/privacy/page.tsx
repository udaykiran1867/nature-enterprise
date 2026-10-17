import type { Metadata } from "next";
import { PageShell, Placeholder } from "@/components/shell/PageShell";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function Page() {
  return (
    <PageShell title="Privacy Policy">
      <Placeholder>[Placeholder: this policy will be published once the business owner provides the approved text.]</Placeholder>
    </PageShell>
  );
}
