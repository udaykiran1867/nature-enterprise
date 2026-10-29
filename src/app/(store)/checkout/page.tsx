import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { Skeleton } from "@/components/ui/skeleton";
import { getDeliveryFee, getPaymentOptions } from "@/services/settings";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

async function Checkout() {
  const [deliveryFee, payment] = await Promise.all([getDeliveryFee(), getPaymentOptions()]);
  return <CheckoutForm deliveryFee={deliveryFee} payment={payment} />;
}

export default function CheckoutPage() {
  return (
    <div className="container-page py-10 md:py-12">
      <h1 className="mb-8 text-4xl">Checkout</h1>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}><Checkout /></Suspense>
    </div>
  );
}
