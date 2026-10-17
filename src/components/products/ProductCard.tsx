import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { ProductImage } from "./ProductImage";
import { formatINR } from "@/lib/formatting";
import { isInStock, startingPrice } from "@/lib/products";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  const price = startingPrice(product);
  const inStock = isInStock(product);
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group card flex flex-col overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-forest/10"
    >
      <div className="relative overflow-hidden">
        <ProductImage
          path={product.image_path}
          alt={product.image_alt ?? product.name}
          sizes="(min-width:1280px) 22vw, (min-width:768px) 30vw, 46vw"
          className="!aspect-[5/4] transition-transform duration-500 group-hover:scale-105"
        />
        {!inStock && <span className="badge badge-gray absolute left-3 top-3 bg-white/95 shadow-sm">Out of stock</span>}
        {product.is_featured && inStock && <span className="badge absolute left-3 top-3 bg-terracotta text-white shadow-sm">Bestseller</span>}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5 sm:p-4">
        {product.category && <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-terracotta">{product.category.name}</p>}
        <h3 className="font-display text-xl font-semibold leading-tight text-forest-dark sm:text-2xl">{product.name}</h3>
        {product.description && <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{price !== null ? "From" : ""}</p>
            <p className="text-lg font-semibold leading-none text-forest">{price !== null ? formatINR(price) : "Unavailable"}</p>
          </div>
          <span className="flex size-9 items-center justify-center rounded-full bg-sage text-forest transition-colors group-hover:bg-forest group-hover:text-ivory" aria-hidden>
            <ShoppingBag className="size-[18px]" />
          </span>
        </div>
      </div>
    </Link>
  );
}
