"use client";

import { useState } from "react";
import { MinusIcon, PlusIcon, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { formatINR, packLabel } from "@/lib/formatting";
import { isVariantAvailable, sortVariants } from "@/lib/products";
import { useCart } from "@/store/cart";
import type { Variant } from "@/types";

type Props = { product: { id: string; slug: string; name: string; image_path: string | null }; variants: Variant[] };

export function VariantPicker({ product, variants }: Props) {
  const sorted = sortVariants(variants);
  const addItem = useCart((s) => s.addItem);
  const [selectedId, setSelectedId] = useState(() => (sorted.find(isVariantAvailable) ?? sorted[0])?.id);
  const [qty, setQty] = useState(1);

  const selected = sorted.find((v) => v.id === selectedId);
  if (!selected) return <p className="text-muted-foreground">No pack sizes are available right now.</p>;

  const available = isVariantAvailable(selected);
  const max = Math.max(selected.stock_quantity, 1);
  const lowStock = available && selected.stock_quantity <= selected.low_stock_threshold;

  function handleAdd() {
    if (!selected || !available) return;
    const { capped } = addItem(
      {
        variantId: selected.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        packLabel: packLabel(selected.pack_size, selected.unit),
        unitPrice: Number(selected.price),
        maxQuantity: selected.stock_quantity,
        imagePath: product.image_path,
      },
      qty
    );
    if (capped) toast.info("You already have the maximum available quantity in your cart.");
    else toast.success(`${product.name} (${packLabel(selected.pack_size, selected.unit)}) added to cart`);
  }

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">Pack size</legend>
        <div className="flex flex-wrap gap-2">
          {sorted.map((v) => {
            const active = v.id === selectedId;
            return (
              <label key={v.id} className={`cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/30 ${active ? "border-forest bg-forest text-ivory" : "border-input bg-card hover:bg-secondary"} ${isVariantAvailable(v) ? "" : "opacity-60"}`}>
                <input
                  type="radio" name="pack-size" className="sr-only" checked={active}
                  onChange={() => { setSelectedId(v.id); setQty(1); }}
                />
                {packLabel(v.pack_size, v.unit)}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div>
        <p className="text-3xl font-semibold text-forest">{formatINR(Number(selected.price))}</p>
        <p role="status" className={`mt-1 text-sm font-medium ${available ? (lowStock ? "text-terracotta" : "text-forest") : "text-terracotta"}`}>
          {!available ? "Out of stock" : lowStock ? `Only ${selected.stock_quantity} left` : "In stock"}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="inline-flex h-11 items-center self-start rounded-lg border border-input bg-card">
          <button type="button" aria-label="Decrease quantity" disabled={!available || qty <= 1}
            className="flex size-11 items-center justify-center disabled:opacity-40" onClick={() => setQty((q) => Math.max(1, q - 1))}>
            <MinusIcon className="size-4" aria-hidden />
          </button>
          <span className="w-8 text-center text-sm font-medium" aria-live="polite">{qty}</span>
          <button type="button" aria-label="Increase quantity" disabled={!available || qty >= max}
            className="flex size-11 items-center justify-center disabled:opacity-40" onClick={() => setQty((q) => Math.min(max, q + 1))}>
            <PlusIcon className="size-4" aria-hidden />
          </button>
        </div>
        <button type="button" className="btn btn-accent flex-1 sm:flex-none sm:px-8" disabled={!available} onClick={handleAdd}>
          <ShoppingBag className="size-4" aria-hidden />
          {available ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </div>
  );
}
