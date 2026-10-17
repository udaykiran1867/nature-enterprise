import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";

async function Gate({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin(); // server-side authorisation for every admin page
  return <AdminShell email={user.email}>{children}</AdminShell>;
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="size-6 animate-spin text-forest" aria-label="Loading" /></div>}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}
