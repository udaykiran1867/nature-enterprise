"use server";

import { buildOrderMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { normalizePhone, orderRequestSchema } from "@/schemas/checkout";
import { createOrder } from "@/services/orders";
import { resolveWhatsAppNumber } from "@/services/settings";

export type SubmitResult =
  | { ok: true; orderNumber: string; token: string; whatsappUrl: string; message: string }
  | { ok: false; error: string };

export async function submitOrder(raw: unknown): Promise<SubmitResult> {
  const parsed = orderRequestSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Some details look invalid. Please check the form and try again." };

  const waNumber = await resolveWhatsAppNumber();
  if (!waNumber) return { ok: false, error: "WhatsApp ordering isn't set up yet. Please contact the store directly." };

  const result = await createOrder(parsed.data);
  if (!result.ok) return result;

  const { order } = result;
  const c = parsed.data;
  const message = buildOrderMessage({
    orderNumber: order.order_number,
    customer: { name: c.name, phone: normalizePhone(c.phone), address: c.address, landmark: c.landmark, city: c.city, state: c.state, postalCode: c.postalCode },
    items: order.items.map((i) => ({ name: i.name, pack: i.pack, quantity: i.quantity, lineTotal: Number(i.line_total) })),
    subtotal: Number(order.subtotal), deliveryFee: Number(order.delivery_fee), total: Number(order.total),
    notes: c.notes,
  });
  return { ok: true, orderNumber: order.order_number, token: order.access_token, whatsappUrl: buildWhatsAppUrl(waNumber, message), message };
}
