import type { Product, Variant } from "@/types";

export const isVariantAvailable = (v: Variant) => v.is_available && v.stock_quantity > 0;
export const isInStock = (p: Product) => p.variants.some(isVariantAvailable);

export function startingPrice(p: Product): number | null {
  const prices = p.variants.filter((v) => v.is_available).map((v) => Number(v.price));
  return prices.length ? Math.min(...prices) : null;
}

const UNIT_FACTOR: Record<string, number> = { g: 1, kg: 1000, ml: 1, l: 1000 };
export const sortVariants = (variants: Variant[]) =>
  [...variants].sort(
    (a, b) =>
      Number(a.pack_size) * (UNIT_FACTOR[a.unit.toLowerCase()] ?? 1) -
      Number(b.pack_size) * (UNIT_FACTOR[b.unit.toLowerCase()] ?? 1)
  );

export type SortKey = "name" | "price-asc" | "price-desc";
export function sortProducts(products: Product[], sort: SortKey): Product[] {
  if (sort === "name") return products;
  const dir = sort === "price-asc" ? 1 : -1;
  return [...products].sort((a, b) => ((startingPrice(a) ?? Infinity) - (startingPrice(b) ?? Infinity)) * dir);
}
