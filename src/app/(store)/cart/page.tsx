import type { Metadata } from "next";
import { Suspense } from "react";
import { CartView } from "@/components/cart/CartView";
import { Skeleton } from "@/components/ui/skeleton";
import { getDeliveryFee } from "@/services/settings";

export const metadata: Metadata = { title: "Your Cart", robots: { index: false } };

async function Cart() {
  return <CartView deliveryFee={await getDeliveryFee()} />;
}

export default function CartPage() {
  return (
    <div className="container-page py-10 md:py-12">
      <h1 className="mb-8 text-4xl">Your Cart</h1>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}><Cart /></Suspense>
    </div>
  );
}
