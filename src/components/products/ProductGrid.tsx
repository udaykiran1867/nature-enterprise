import { ProductCard } from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/types";

const GRID = "grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className={GRID}>
      {products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={GRID} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <Skeleton className="aspect-square rounded-none" />
          <div className="space-y-2 p-4"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-1/2" /></div>
        </div>
      ))}
    </div>
  );
}
