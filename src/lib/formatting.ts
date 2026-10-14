import { publicEnv } from "@/lib/env";

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

export const packLabel = (size: number, unit: string) => `${Number(size)} ${unit}`;

/** Accepts a Supabase Storage path (product-images bucket) or a full https URL. */
export function imageUrl(path: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
}
