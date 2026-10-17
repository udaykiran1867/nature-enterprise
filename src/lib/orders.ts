export const ORDER_STATUSES = ["submitted", "awaiting_confirmation", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  submitted: "Submitted",
  awaiting_confirmation: "Awaiting customer confirmation",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Allowed status transitions. Mirrors the database function admin_set_order_status. */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  submitted: ["awaiting_confirmation", "confirmed", "cancelled"],
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
