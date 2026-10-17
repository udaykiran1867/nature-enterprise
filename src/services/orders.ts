import "server-only";
import { createAdminClient } from "@/lib/admin";
import type { OrderMessageInput } from "@/lib/whatsapp";
import { normalizePhone, type OrderRequest } from "@/schemas/checkout";

export type PlacedOrder = {
  order_id: string; order_number: string; access_token: string;
  subtotal: number; delivery_fee: number; total: number; replayed: boolean;
  items: { name: string; pack: string; unit_price: number; quantity: number; line_total: number }[];
};

function friendlyError(msg: string): string {
  const [code, name] = [msg.split(":")[0], msg.split(":").slice(1).join(":")];
  if (code.includes("out_of_stock")) return `Sorry, there isn't enough stock for ${name || "one of your items"}. Please reduce the quantity in your cart.`;
  if (code.includes("unavailable")) return `${name || "One of your items"} is no longer available. Please remove it from your cart.`;
  if (msg.includes("rate_limited")) return "Too many orders from this phone number recently. Please try again later or contact us.";
  return "We couldn't save your order. Please try again.";
}

export async function createOrder(input: OrderRequest): Promise<{ ok: true; order: PlacedOrder } | { ok: false; error: string }> {
  const { data, error } = await createAdminClient().rpc("create_order", {
    p_idempotency_key: input.idempotencyKey,
    p_customer: {
      name: input.name, phone: normalizePhone(input.phone), address: input.address, landmark: input.landmark,
      city: input.city, state: input.state, postal_code: input.postalCode, notes: input.notes,
    },
    p_items: input.items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
  });
  if (error || !data) {
    console.error("create_order failed:", error?.message);
    return { ok: false, error: friendlyError(error?.message ?? "") };
  }
  return { ok: true, order: data as PlacedOrder };
}

/** Loads an order for the confirmation page. Requires the unguessable access token. */
export async function getOrderForConfirmation(orderNumber: string, token: string): Promise<OrderMessageInput | null> {
  if (!/^NE-[A-Z0-9]{6}$/.test(orderNumber) || !/^[a-f0-9]{32}$/.test(token)) return null;
  const { data } = await createAdminClient()
    .from("orders")
    .select("order_number,customer_name,customer_phone,delivery_address,landmark,city,state,postal_code,customer_notes,subtotal,delivery_fee,total,order_items(product_name_snapshot,pack_size_snapshot,quantity,line_total)")
    .eq("order_number", orderNumber)
    .eq("access_token", token)
    .maybeSingle();
  if (!data) return null;
  return {
    orderNumber: data.order_number,
    customer: {
      name: data.customer_name, phone: data.customer_phone, address: data.delivery_address,
      landmark: data.landmark ?? undefined, city: data.city, state: data.state, postalCode: data.postal_code,
    },
    items: (data.order_items as { product_name_snapshot: string; pack_size_snapshot: string; quantity: number; line_total: number }[]).map((i) => ({
      name: i.product_name_snapshot, pack: i.pack_size_snapshot, quantity: i.quantity, lineTotal: Number(i.line_total),
    })),
    subtotal: Number(data.subtotal), deliveryFee: Number(data.delivery_fee), total: Number(data.total),
    notes: data.customer_notes ?? undefined,
  };
}
