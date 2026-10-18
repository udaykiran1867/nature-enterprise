import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink, Loader2, LogOut, MenuIcon } from "lucide-react";
import { LogoMark } from "@/components/layout/Logo";
import { AdminNav } from "./AdminNav";
import { signOut } from "@/app/admin/actions";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

function SidebarBody({ email }: { email?: string }) {
  return (
    <div className="flex h-full flex-col justify-between overflow-y-auto bg-forest-dark p-4 text-ivory">
      <div>
        <div className="flex items-center gap-2 px-2 pt-1">
          <LogoMark plate className="h-8 w-auto" />
          <span className="font-display text-xl">Nature Admin</span>
        </div>
        <div className="mt-6">
          <AdminNav />
        </div>
      </div>
      <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ivory/75 hover:bg-white/10 hover:text-white transition-colors">
          <ExternalLink className="size-4" aria-hidden /> View Store
        </Link>
        <form action={signOut}>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ivory/75 hover:bg-white/10 hover:text-white transition-colors">
            <LogOut className="size-4" aria-hidden /> Logout
          </button>
        </form>
        {email && <p className="truncate px-3 pt-2 text-xs text-ivory/50">{email}</p>}
      </div>
    </div>
  );
}

export function AdminShell({ email, children }: { email?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/60">
      {/* Fixed sidebar on desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block shadow-md">
        <SidebarBody email={email} />
      </aside>

      {/* Main content shifted right by sidebar width */}
      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
          <span className="font-display text-xl text-forest-dark">Nature Admin</span>
          <Sheet>
            <SheetTrigger className="icon-btn" aria-label="Open admin menu"><MenuIcon className="size-5" aria-hidden /></SheetTrigger>
            <SheetContent side="left" className="w-72 p-0"><SheetTitle className="sr-only">Admin menu</SheetTitle><SidebarBody email={email} /></SheetContent>
          </Sheet>
        </header>
        <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
          <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-forest" aria-label="Loading" /></div>}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
