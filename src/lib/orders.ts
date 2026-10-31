
/**
 * Order lifecycle: Payment > Confirmed > Dispatched (db value "shipped") > Delivered.
 * "submitted" is only the starting point right after checkout; "cancelled" is the exit.
 */
export const ORDER_STATUSES = ["submitted", "payment", "confirmed", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  submitted: "New order",
  payment: "Payment",
  confirmed: "Confirmed",
  shipped: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Statuses used before the payment step existed. They only appear in old timeline entries. */
const LEGACY_LABEL: Record<string, string> = { awaiting_confirmation: "Awaiting confirmation", processing: "Processing" };

/** Label for any status string, including old ones that may still be in an order's history. */
export const statusLabelOf = (s: string): string => (isOrderStatus(s) ? STATUS_LABEL[s] : LEGACY_LABEL[s] ?? s);

/** Allowed status transitions. Mirrors the database function admin_set_order_status. */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  submitted: ["payment", "confirmed", "cancelled"],
  payment: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const canTransition = (from: OrderStatus, to: OrderStatus) => NEXT_STATUSES[from]?.includes(to) ?? false;

export const STATUS_BADGE: Record<OrderStatus, string> = {
  submitted: "badge-amber",
  payment: "badge-amber",
  confirmed: "badge-blue",
  shipped: "badge-blue",
  delivered: "badge-green",
  cancelled: "badge-gray",
};

export const isOrderStatus = (s: string): s is OrderStatus => (ORDER_STATUSES as readonly string[]).includes(s);

export type StockState = "in" | "low" | "out";
export const stockState = (qty: number, threshold: number): StockState => (qty <= 0 ? "out" : qty <= threshold ? "low" : "in");

/** The progress steps shown on the order page. */
export const PROGRESS_STEPS = ["payment", "confirmed", "shipped", "delivered"] as const;

/** Public payment page (shows the shop's UPI QR code). Same link for every order. */
export function paymentPageUrl(): string {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");
  return `${site}/pay`;
}

/** The customer-facing payment request. The customer already knows the amount, so it is not repeated here. */
function paymentLines(): string {
  return [
    "please make the payment to confirm your order. \u{1F4B3}",
    "",
    "Open this link to see the QR code and pay:",
    paymentPageUrl(),
    "",
    "After paying, please share the screenshot of your payment here. Once you send the screenshot, your order will be confirmed. \u{1F64F}",
  ].join("\n");
}

/** Builds the WhatsApp link (customer's number + ready-made message) for a status update. The admin presses Send themselves. */
export function statusWhatsAppUrl(o: { name: string; phone: string; orderNumber: string; status: OrderStatus; note?: string }): string {
  const lines: Record<OrderStatus, string> = {
    submitted: "we have received your order.",
    payment: paymentLines(),
    confirmed: "your order has been confirmed. \u2705",
    shipped: "your order has been dispatched and is on its way. \u{1F69A}",
    delivered: "your order has been delivered. We hope you enjoy it! \u{1F64F}",
    cancelled: "your order has been cancelled. Please contact us if you have any questions.",
  };
  const note = o.note?.trim() ? `\n\nNote: ${o.note.trim()}` : "";
  const text = `Hello ${o.name}, this is Nature Enterprises. Update on your order ${o.orderNumber}: ${lines[o.status]}${note}\n\nThank you!`;
  return `https://wa.me/91${o.phone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(text)}`;
}
