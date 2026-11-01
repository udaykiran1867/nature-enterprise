import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { Download, Smartphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { imageUrl } from "@/lib/formatting";
import { SITE } from "@/lib/site";
import { getPublicSettings } from "@/services/settings";

export const metadata: Metadata = { title: "Pay now", robots: { index: false, follow: false } };

async function Payment() {
  const { payment } = await getPublicSettings();
  const qr = imageUrl(payment.qrImage || null);
  const name = payment.payeeName || SITE.name;
  // Opens the customer's UPI app (PhonePe, Google Pay, Paytm...) with our account filled in; they type the amount themselves.
  const upiLink = payment.upiId ? `upi://pay?${new URLSearchParams({ pa: payment.upiId, pn: name, cu: "INR" })}` : null;

  return (
    <div className="mx-auto max-w-md space-y-6 text-center">
      <h1 className="text-5xl">Pay now!</h1>
      {qr ? (
        <div className="card overflow-hidden p-3">
          <Image src={qr} alt={`QR code to pay ${name}`} width={720} height={720} sizes="(max-width: 640px) 90vw, 448px" priority className="h-auto w-full rounded-lg" />
          <p className="px-2 pt-4 text-xl font-semibold text-forest-dark">{name}</p>
          <div className="flex flex-col gap-3 p-3 pt-4 sm:flex-row">
            <a href="/pay/qr" download className="btn btn-outline flex-1"><Download className="size-4" aria-hidden /> Download QR</a>
            {upiLink && <a href={upiLink} className="btn btn-primary flex-1"><Smartphone className="size-4" aria-hidden /> Open UPI app</a>}
          </div>
          {upiLink && <p className="px-3 pb-3 text-xs text-muted-foreground">Tap &ldquo;Open UPI app&rdquo; on your phone, enter the amount and pay. Then send us the payment screenshot on WhatsApp.</p>}
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
