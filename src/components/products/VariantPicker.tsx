"use client";

import { useState } from "react";
import { Check, MinusIcon, PlusIcon, ShoppingBag } from "lucide-react";
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
  const [isAdded, setIsAdded] = useState(false);

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
    if (capped) {
      toast.info("You already have the maximum available quantity in your cart.");
    } else {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1500);
      toast.success(`${product.name} (${packLabel(selected.pack_size, selected.unit)}) added to cart`);
    }
  }

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">Pack size</legend>
        <div className="flex flex-wrap gap-2">
          {sorted.map((v) => {
            const active = v.id === selectedId;
            return (
              <label
                key={v.id}
                className={`cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-150 select-none hover:-translate-y-0.5 active:scale-95 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/30 ${
                  active
                    ? "border-forest bg-forest text-ivory shadow-xs"
                    : "border-input bg-card hover:bg-secondary hover:border-forest/30"
                } ${isVariantAvailable(v) ? "" : "opacity-60"}`}
              >
                <input
                  type="radio"
                  name="pack-size"
                  className="sr-only"
                  checked={active}
                  onChange={() => {
                    setSelectedId(v.id);
                    setQty(1);
                  }}
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

      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center">
        {/* Quantity selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground sm:hidden">Quantity</span>
          <div className="inline-flex h-12 items-center rounded-xl border border-input/90 bg-card shadow-2xs">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={!available || qty <= 1}
              className="flex size-12 items-center justify-center rounded-l-xl text-foreground/80 transition-all hover:bg-secondary hover:text-forest-dark active:scale-90 active:bg-secondary/80 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              <MinusIcon className="size-4" aria-hidden />
            </button>
            <span className="w-10 text-center text-base font-semibold tabular-nums text-foreground select-none" aria-live="polite">
              {qty}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={!available || qty >= max}
              className="flex size-12 items-center justify-center rounded-r-xl text-foreground/80 transition-all hover:bg-secondary hover:text-forest-dark active:scale-90 active:bg-secondary/80 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              onClick={() => setQty((q) => Math.min(max, q + 1))}
            >
              <PlusIcon className="size-4" aria-hidden />
            </button>
          </div>
        </div>

        {/* Add to Cart button */}
        <button
          type="button"
          disabled={!available}
          onClick={handleAdd}
          className={`group relative flex h-[52px] sm:h-12 w-full sm:w-auto sm:min-w-[210px] sm:px-8 items-center justify-center gap-2.5 rounded-xl text-base font-semibold transition-all duration-200 ease-out select-none cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-terracotta/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 ${
            !available
              ? "bg-muted text-muted-foreground shadow-none"
              : isAdded
              ? "bg-forest text-ivory shadow-lg shadow-forest/25 scale-[1.01]"
              : "bg-terracotta text-white shadow-md shadow-terracotta/25 hover:bg-terracotta-dark hover:shadow-xl hover:shadow-terracotta/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] active:shadow-xs active:bg-[#7e3b27]"
          }`}
        >
          {isAdded ? (
            <>
              <Check className="size-5 animate-in zoom-in-75 duration-200 stroke-[2.5]" aria-hidden />
              <span>Added to Cart!</span>
            </>
          ) : (
            <>
              <ShoppingBag
                className="size-5 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6 stroke-[2]"
                aria-hidden
              />
              <span>{available ? "Add to Cart" : "Out of Stock"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
