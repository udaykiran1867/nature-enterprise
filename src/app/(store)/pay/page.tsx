import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { imageUrl } from "@/lib/formatting";
import { SITE } from "@/lib/site";
import { getPublicSettings } from "@/services/settings";

export const metadata: Metadata = { title: "Pay now", robots: { index: false, follow: false } };

async function Payment() {
  const { payment } = await getPublicSettings();
  const qr = imageUrl(payment.qrImage || null);
  const name = payment.payeeName || SITE.name;

  return (
    <div className="mx-auto max-w-md space-y-6 text-center">
      <h1 className="text-5xl">Pay now!</h1>
      {qr ? (
        <div className="card overflow-hidden p-3">
          <Image src={qr} alt={`QR code to pay ${name}`} width={720} height={720} sizes="(max-width: 640px) 90vw, 448px" priority className="h-auto w-full rounded-lg" />
          <p className="px-2 pb-2 pt-4 text-xl font-semibold text-forest-dark">{name}</p>
        </div>
      ) : (
        <div className="card px-6 py-12">
          <p className="text-muted-foreground">The payment QR code isn&apos;t available right now. Please message us on WhatsApp and we will help you.</p>
          <p className="mt-4 text-xl font-semibold text-forest-dark">{name}</p>
        </div>
      )}
    </div>
  );
}

export default function PayPage() {
  return (
    <div className="container-page py-10 md:py-14">
      <Suspense fallback={<Skeleton className="mx-auto h-[28rem] max-w-md" />}>
        <Payment />
      </Suspense>
    </div>
  );
}
