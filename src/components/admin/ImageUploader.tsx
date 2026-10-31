"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/client";
import { imageUrl } from "@/lib/formatting";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX = 5 * 1024 * 1024;

type Props = {
  value: string;
  onChange: (path: string) => void;
  /** Storage folder inside the product-images bucket. */
  folder?: string;
  alt?: string;
  inputId?: string;
  /** "contain" shows the whole image (use for QR codes); "cover" crops to a square (products). */
  fit?: "cover" | "contain";
  hint?: string;
};

export function ImageUploader({ value, onChange, folder = "products", alt = "Product preview", inputId = "product-image", fit = "cover", hint = "JPG, PNG or WebP, up to 5 MB. Square photos look best." }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const src = imageUrl(value || null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setError(null);
    const ext = TYPES[file.type];
    if (!ext) return setError("Use a JPG, PNG or WebP image.");
    if (file.size > MAX) return setError("Image must be 5 MB or smaller.");
    setBusy(true);
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error: err } = await createClient().storage.from("product-images").upload(path, file, { contentType: file.type, upsert: false });
    setBusy(false);
    if (input.current) input.current.value = "";
    if (err) return setError("Upload failed. Please try again.");
    onChange(path);
  }

  return (
    <div className="space-y-2">
      <div className="relative flex aspect-square w-full max-w-60 items-center justify-center overflow-hidden rounded-xl border border-dashed border-input bg-sage/50">
        {src ? <Image src={src} alt={alt} fill sizes="240px" className={fit === "contain" ? "object-contain" : "object-cover"} /> : <ImagePlus className="size-8 text-forest/50" aria-hidden />}
        {busy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 text-sm" role="status">
            <Loader2 className="size-5 animate-spin text-forest" aria-hidden /> Uploading…
          </div>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id={inputId} onChange={(e) => pick(e.target.files?.[0])} />
      <div className="flex gap-2">
        <label htmlFor={inputId} className="btn btn-outline h-10 cursor-pointer">{src ? "Replace image" : "Upload image"}</label>
        {src && <button type="button" onClick={() => onChange("")} className="btn btn-outline h-10 text-destructive"><Trash2 className="size-4" aria-hidden /> Remove</button>}
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
