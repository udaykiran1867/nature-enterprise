import Image from "next/image";
import { Leaf } from "lucide-react";
import { imageUrl } from "@/lib/formatting";

export function ProductImage({
  path, alt, sizes, priority = false, className = "",
}: { path: string | null; alt: string; sizes: string; priority?: boolean; className?: string }) {
  const src = imageUrl(path);
  return (
    <div className={`relative aspect-square overflow-hidden bg-sage ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-forest/60">
          <Leaf className="size-8" aria-hidden />
          <span className="text-xs">Photo coming soon</span>
        </div>
      )}
    </div>
  );
}
