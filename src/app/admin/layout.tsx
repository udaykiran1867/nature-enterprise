import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

// Admin pages depend on live Supabase auth cookies and live database state — disable instant prerendering for admin
export const instant = false;

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-muted/60">{children}</div>;
}
