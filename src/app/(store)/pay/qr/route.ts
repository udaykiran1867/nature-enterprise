import { imageUrl } from "@/lib/formatting";
import { getPublicSettings } from "@/services/settings";

const TYPES: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };

/** Serves the shop's UPI QR as a file download. The browser would ignore a plain "download" link to
 *  the image because it lives on another domain (storage), so it is passed through our own domain. */
export async function GET() {
  const { payment } = await getPublicSettings();
  const url = imageUrl(payment.qrImage || null);
  if (!url) return new Response("QR code not available", { status: 404 });

  const upstream = await fetch(url);
  if (!upstream.ok) return new Response("QR code not available", { status: 404 });

  const ext = payment.qrImage.split(".").pop()?.toLowerCase() ?? "png";
  return new Response(await upstream.arrayBuffer(), {
    headers: {
      "Content-Type": TYPES[ext] ?? upstream.headers.get("content-type") ?? "image/png",
      "Content-Disposition": `attachment; filename="nature-enterprises-payment-qr.${TYPES[ext] ? ext : "png"}"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
