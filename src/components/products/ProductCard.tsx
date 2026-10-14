import Link from "next/link";
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
      className="group card flex flex-col overflow-hidden transition-shadow hover:shadow-md"
    >
      <ProductImage
        path={product.image_path}
        alt={product.image_alt ?? product.name}
        sizes="(min-width:1280px) 22vw, (min-width:768px) 30vw, 46vw"
        className="transition-transform duration-300 group-hover:scale-[1.03]"
      />
      <div className="flex flex-1 flex-col gap-1 border-t border-border bg-card p-3 sm:p-4">
        {product.category && (
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{product.category.name}</p>
        )}
        <h3 className="font-sans text-base font-semibold text-foreground">{product.name}</h3>
        {product.description && <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-sm">
          <span className="font-semibold text-forest">{price !== null ? `From ${formatINR(price)}` : "Unavailable"}</span>
          <span className={`text-xs font-medium ${inStock ? "text-forest" : "text-terracotta"}`}>
            {inStock ? "In stock" : "Out of stock"}
          </span>
        </div>
      </div>
    </Link>
  );
}
