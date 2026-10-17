import { formatINR } from "@/lib/formatting";

export type OrderMessageInput = {
  orderNumber: string;
  customer: { name: string; phone: string; address: string; landmark?: string; city: string; state: string; postalCode: string };
  items: { name: string; pack: string; quantity: number; lineTotal: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes?: string;
};

/** Builds the readable order message. Pure function: safe to unit test. */
export function buildOrderMessage(o: OrderMessageInput): string {
  const c = o.customer;
  const lines = [
    "Hello Nature Enterprises! I'd like to place an order.",
    "",
    `ORDER REFERENCE: ${o.orderNumber}`,
    "",
    "CUSTOMER DETAILS",
    `Name: ${c.name}`,
    `Phone: ${c.phone}`,
    `Address: ${c.address}`,
    ...(c.landmark ? [`Landmark: ${c.landmark}`] : []),
    `City: ${c.city}`,
    `State: ${c.state}`,
    `PIN Code: ${c.postalCode}`,
    "",
    "ORDER ITEMS",
    ...o.items.map((i, n) => `${n + 1}. ${i.name} - ${i.pack} x ${i.quantity} = ${formatINR(i.lineTotal)}`),
    "",
    `Subtotal: ${formatINR(o.subtotal)}`,
    ...(o.deliveryFee > 0 ? [`Delivery Fee: ${formatINR(o.deliveryFee)}`] : []),
    `TOTAL: ${formatINR(o.total)}`,
    ...(o.notes ? ["", `Customer Notes: ${o.notes}`] : []),
    "",
    "Please confirm product availability and delivery details.",
    "",
    "Thank you!",
  ];
  return lines.join("\n");
}

/** Official WhatsApp Click to Chat URL. `number` must be digits only (country code, no +). */
export const buildWhatsAppUrl = (number: string, message: string) =>
  `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
