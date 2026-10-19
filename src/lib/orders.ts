export const ORDER_STATUSES = ["submitted", "awaiting_confirmation", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  submitted: "New order",
  awaiting_confirmation: "Awaiting confirmation",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Allowed status transitions. Mirrors the database function admin_set_order_status. */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  submitted: ["confirmed", "cancelled"],
  awaiting_confirmation: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const canTransition = (from: OrderStatus, to: OrderStatus) => NEXT_STATUSES[from]?.includes(to) ?? false;

export const STATUS_BADGE: Record<OrderStatus, string> = {
  submitted: "badge-amber",
  awaiting_confirmation: "badge-amber",
  confirmed: "badge-blue",
  processing: "badge-blue",
  shipped: "badge-blue",
  delivered: "badge-green",
  cancelled: "badge-gray",
};

export const isOrderStatus = (s: string): s is OrderStatus => (ORDER_STATUSES as readonly string[]).includes(s);

export type StockState = "in" | "low" | "out";
export const stockState = (qty: number, threshold: number): StockState => (qty <= 0 ? "out" : qty <= threshold ? "low" : "in");

/** The progress steps shown on the order page. */
export const PROGRESS_STEPS = ["confirmed", "processing", "shipped", "delivered"] as const;

/** Builds the WhatsApp link (customer's number + ready-made message) for a status update. The admin presses Send themselves. */
export function statusWhatsAppUrl(o: { name: string; phone: string; orderNumber: string; status: OrderStatus; note?: string }): string {
  const lines: Record<OrderStatus, string> = {
    submitted: "we have received your order.",
    awaiting_confirmation: "we are waiting for your confirmation on this order.",
    confirmed: "your order has been confirmed. \u2705",
    processing: "your order is being prepared. \u{1F33F}",
    shipped: "your order has been dispatched and is on its way. \u{1F69A}",
    delivered: "your order has been delivered. We hope you enjoy it! \u{1F64F}",
    cancelled: "your order has been cancelled. Please contact us if you have any questions.",
  };
  const note = o.note?.trim() ? `\n\nNote: ${o.note.trim()}` : "";
  const text = `Hello ${o.name}, this is Nature Enterprises. Update on your order ${o.orderNumber}: ${lines[o.status]}${note}\n\nThank you!`;
  return `https://wa.me/91${o.phone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(text)}`;
}
