import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/layout/Logo";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-forest-dark p-12 text-ivory lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full border border-white/10" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-[28rem] rounded-full border border-white/10" aria-hidden />
        <div className="flex items-center gap-2">
          <LogoMark plate className="h-10 w-auto" />
          <span className="font-display text-2xl">Nature Enterprises</span>
        </div>
        <div>
          <h2 className="max-w-sm text-4xl !text-ivory">Manage your spice store with ease.</h2>
          <p className="mt-3 max-w-sm text-ivory/70">Products, pack sizes and orders, all in one place.</p>
        </div>
      </aside>
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="card p-7 shadow-sm">
            <div className="mb-4 lg:hidden"><LogoMark className="h-12 w-auto" /></div>
            <h1 className="text-3xl">Admin sign in</h1>
            <p className="mb-6 mt-1 text-sm text-muted-foreground">Authorised staff only.</p>
            <LoginForm />
          </div>
          <Link href="/" className="mt-5 block text-center text-sm text-muted-foreground hover:text-forest">← Back to store</Link>
        </div>
      </main>
    </div>
  );
}
