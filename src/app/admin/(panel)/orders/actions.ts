"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { getAdmin } from "@/lib/auth";
import { isOrderStatus } from "@/lib/orders";

type R = { ok: true; message?: string } | { ok: false; error: string };
const idSchema = z.uuid();

export async function changeOrderStatus(orderId: string, status: string, note: string): Promise<R> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "You are not authorised to do this." };
  if (!idSchema.safeParse(orderId).success || !isOrderStatus(status)) return { ok: false, error: "Invalid request." };
  const { error } = await admin.supabase.rpc("admin_set_order_status", { p_order_id: orderId, p_status: status, p_note: note.trim().slice(0, 300) });
  if (error) return { ok: false, error: error.message.includes("invalid_transition") ? "That status change isn't allowed from the current status." : "Couldn't update the order. Please try again." };
  if (status === "cancelled") updateTag("products"); // stock was returned
  return { ok: true };
}

export async function setWhatsAppReceived(orderId: string, received: boolean): Promise<R> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "You are not authorised to do this." };
  if (!idSchema.safeParse(orderId).success) return { ok: false, error: "Invalid request." };
  const { error } = await admin.supabase.from("orders").update({ whatsapp_handoff_status: received ? "received" : "pending", updated_at: new Date().toISOString() }).eq("id", orderId);
  return error ? { ok: false, error: "Couldn't update the order." } : { ok: true };
}

export async function releaseStaleOrders(hours: number): Promise<R> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "You are not authorised to do this." };
  const h = Math.min(Math.max(Math.floor(hours) || 48, 1), 720);
  const { data, error } = await admin.supabase.rpc("release_stale_orders", { p_hours: h });
  if (error) return { ok: false, error: "Couldn't release stock. Please try again." };
  updateTag("products");
  return { ok: true, message: `${data ?? 0} unconfirmed order${data === 1 ? "" : "s"} cancelled and stock released.` };
}

export async function deleteOrder(orderId: string): Promise<R> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "You are not authorised to do this." };
  if (!idSchema.safeParse(orderId).success) return { ok: false, error: "Invalid request." };
  const { error } = await admin.supabase.rpc("admin_delete_order", { p_order_id: orderId });
  if (error) return { ok: false, error: "Couldn't delete the order. Please try again." };
  updateTag("products"); // reserved stock may have been returned
  return { ok: true };
}
