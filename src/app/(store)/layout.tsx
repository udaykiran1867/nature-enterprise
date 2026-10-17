import { Suspense } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getPublicSettings } from "@/services/settings";

async function Announcement() {
  const { announcement } = await getPublicSettings();
  if (!announcement) return null;
  return <p className="bg-terracotta px-4 py-2 text-center text-sm font-medium text-white">{announcement}</p>;
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}><Announcement /></Suspense>
      <Header />
      <main id="main" className="flex-1">{children}</main>
      <Suspense fallback={<div className="mt-20 h-96 bg-forest-dark" />}><Footer /></Suspense>
    </>
  );
}
