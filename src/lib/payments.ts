export const PAYMENT_METHODS = ["cod", "upi"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_STATUSES = ["pending", "paid", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = { cod: "Cash on Delivery", upi: "UPI" };

export const isPaymentMethod = (v: unknown): v is PaymentMethod => v === "cod" || v === "upi";
export const isPaymentStatus = (v: unknown): v is PaymentStatus => v === "pending" || v === "paid" || v === "refunded";

export type PaymentOptions = { codEnabled: boolean; upiEnabled: boolean; codMaxAmount: number };

/** Valid UPI ID (VPA), e.g. nature@okhdfcbank. */
export const UPI_ID_RE = /^[a-zA-Z0-9._-]{2,100}@[a-zA-Z][a-zA-Z0-9]{1,63}$/;

/** Short label for lists, e.g. "UPI · Paid" or "COD · Cash due". Null for orders placed before payments existed. */
export function paymentBadge(method: string | null, status: string, cancelled = false): { label: string; cls: string } | null {
  if (!isPaymentMethod(method)) return null;
  const st = isPaymentStatus(status) ? status : "pending";
  if (cancelled && st === "pending") return { label: `${method === "upi" ? "UPI" : "COD"} · Not paid`, cls: "badge-gray" };
  if (st === "refunded") return { label: `${method === "upi" ? "UPI" : "COD"} · Refunded`, cls: "badge-gray" };
  if (method === "upi") return st === "paid" ? { label: "UPI · Paid", cls: "badge-green" } : { label: "UPI · Pending", cls: "badge-amber" };
  return st === "paid" ? { label: "COD · Collected", cls: "badge-green" } : { label: "COD · Cash due", cls: "badge-blue" };
}

/** Link that opens a UPI app with the payee, amount and note filled in (works on phones). */
export function buildUpiLink({ upiId, name, amount, orderNumber }: { upiId: string; name: string; amount: number; orderNumber: string }): string {
  const enc = encodeURIComponent;
  return `upi://pay?pa=${upiId}&pn=${enc(name)}&am=${amount.toFixed(2)}&cu=INR&tn=${enc(`Order ${orderNumber}`)}`;
}
