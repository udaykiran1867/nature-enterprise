"use client";

import Link from "next/link";
import { MinusIcon, PlusIcon, ShoppingBag, Trash2 } from "lucide-react";
import { OrderTotals } from "./OrderTotals";
import { useCartReady } from "./useCartReady";
import { ProductImage } from "@/components/products/ProductImage";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/formatting";
import { useCart } from "@/store/cart";

export function CartView({ deliveryFee }: { deliveryFee: number }) {
  const ready = useCartReady();
  const { items, setQuantity, removeItem } = useCart();

  if (!ready) return <Skeleton className="h-64 w-full" />;

  if (!items.length) {
    return (
      <div className="card mx-auto flex max-w-lg flex-col items-center gap-3 px-6 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-sage text-forest"><ShoppingBag className="size-7" aria-hidden /></span>
        <h2 className="text-2xl">Your cart is empty</h2>
        <p className="text-muted-foreground">Add a few spices and they&apos;ll show up here.</p>
        <Link href="/products" className="btn btn-primary mt-2">Explore Our Spices</Link>
      </div>
    );
  }

  const subtotal = items.reduce((n, i) => n + i.unitPrice * i.quantity, 0);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <ul className="space-y-3">
        {items.map((i) => (
          <li key={i.variantId} className="card flex gap-4 p-3 sm:p-4">
            <Link href={`/products/${i.slug}`} className="block w-20 shrink-0 sm:w-24">
              <ProductImage path={i.imagePath} alt={i.name} sizes="96px" className="rounded-lg" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/products/${i.slug}`} className="block truncate font-semibold hover:text-forest">{i.name}</Link>
                  <p className="text-sm text-muted-foreground">{i.packLabel} · {formatINR(i.unitPrice)}</p>
                </div>
                <p className="font-semibold text-forest">{formatINR(i.unitPrice * i.quantity)}</p>
              </div>
              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="inline-flex h-10 items-center rounded-lg border border-input bg-card">
                  <button type="button" aria-label={`Decrease ${i.name} quantity`} disabled={i.quantity <= 1}
                    onClick={() => setQuantity(i.variantId, i.quantity - 1)} className="flex size-10 items-center justify-center disabled:opacity-40">
                    <MinusIcon className="size-4" aria-hidden />
                  </button>
                  <span className="w-8 text-center text-sm font-medium" aria-live="polite">{i.quantity}</span>
                  <button type="button" aria-label={`Increase ${i.name} quantity`} disabled={i.quantity >= i.maxQuantity}
                    onClick={() => setQuantity(i.variantId, i.quantity + 1)} className="flex size-10 items-center justify-center disabled:opacity-40">
                    <PlusIcon className="size-4" aria-hidden />
                  </button>
                </div>
                <button type="button" onClick={() => removeItem(i.variantId)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:text-terracotta">
                  <Trash2 className="size-4" aria-hidden /> Remove
                </button>
              </div>
              {i.quantity >= i.maxQuantity && <p className="mt-1 text-xs text-terracotta">Maximum available quantity</p>}
            </div>
          </li>
        ))}
      </ul>

      <aside className="card h-fit space-y-5 p-5 lg:sticky lg:top-24">
        <h2 className="text-2xl">Order summary</h2>
        <OrderTotals subtotal={subtotal} deliveryFee={deliveryFee} />
        <div className="flex flex-col gap-2">
          <Link href="/checkout" className="btn btn-accent">Proceed to Checkout</Link>
          <Link href="/products" className="btn btn-outline">Continue Shopping</Link>
        </div>
        <p className="text-xs text-muted-foreground">Final prices and stock are confirmed when you place your order.</p>
      </aside>
    </div>
  );
}
