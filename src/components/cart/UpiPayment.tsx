import Image from "next/image";
import QRCode from "qrcode";
import { MessageCircle, Smartphone } from "lucide-react";
import { CopyButton } from "./CopyButton";
import { formatINR } from "@/lib/formatting";
import { buildUpiLink } from "@/lib/payments";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type Props = { orderNumber: string; amount: number; upiId: string; payeeName: string; whatsappNumber: string | null };

/** Pay-by-UPI card: QR code, "pay with UPI app" link, and the next steps. Server component. */
export async function UpiPayment({ orderNumber, amount, upiId, payeeName, whatsappNumber }: Props) {
  const link = buildUpiLink({ upiId, name: payeeName, amount, orderNumber });
  const svg = await QRCode.toString(link, { type: "svg", margin: 1, width: 240, errorCorrectionLevel: "M", color: { dark: "#173A29", light: "#FFFFFF" } });
  const qr = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  const proof = whatsappNumber
    ? buildWhatsAppUrl(whatsappNumber, `Hello Nature Enterprises! I have paid ${formatINR(amount)} by UPI for order ${orderNumber}.\nTransaction ID: `)
    : null;

  return (
    <section className="card overflow-hidden" aria-labelledby="upi-heading">
      <div className="border-b border-border bg-sage/50 px-5 py-4">
        <h2 id="upi-heading" className="text-2xl">Pay {formatINR(amount)} with UPI</h2>
        <p className="text-sm text-muted-foreground">Your order is saved. Complete the payment so we can confirm it.</p>
      </div>
      <div className="grid gap-6 p-5 sm:grid-cols-[15rem_1fr] sm:items-center">
        <div className="mx-auto w-full max-w-[15rem] rounded-xl border border-border bg-white p-2">
          <Image src={qr} alt={`UPI QR code to pay ${formatINR(amount)} to ${payeeName}`} width={240} height={240} unoptimized className="h-auto w-full" />
        </div>
        <div className="space-y-4">
          <dl className="space-y-2 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2"><dt className="text-muted-foreground">Pay to</dt><dd className="font-medium">{payeeName}</dd></div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-muted-foreground">UPI ID</dt>
              <dd className="flex items-center gap-2 font-medium"><span className="break-all">{upiId}</span><CopyButton value={upiId} /></dd>
            </div>
            <div className="flex items-center justify-between gap-2"><dt className="text-muted-foreground">Amount</dt><dd className="text-lg font-semibold text-forest">{formatINR(amount)}</dd></div>
          </dl>
          <a href={link} className="btn btn-primary w-full"><Smartphone className="size-4" aria-hidden /> Pay with UPI app</a>
          <p className="text-xs text-muted-foreground">On a phone, the button opens your UPI app. On a computer, scan the QR code with your phone. Please pay the exact amount.</p>
        </div>
      </div>
      <ol className="space-y-2 border-t border-border bg-muted/40 px-5 py-4 text-sm text-muted-foreground">
        <li><strong className="text-foreground">1.</strong> Pay {formatINR(amount)} using the QR code, the button, or the UPI ID.</li>
        <li><strong className="text-foreground">2.</strong> Send us the payment screenshot or transaction ID on WhatsApp.</li>
        <li><strong className="text-foreground">3.</strong> We&apos;ll confirm your payment and prepare your order.</li>
      </ol>
      {proof && (
        <div className="border-t border-border p-5">
          <a href={proof} target="_blank" rel="noopener noreferrer" className="btn btn-accent w-full sm:w-auto"><MessageCircle className="size-4" aria-hidden /> Send payment details on WhatsApp</a>
        </div>
      )}
    </section>
  );
}
