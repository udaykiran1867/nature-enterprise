"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { getAdmin } from "@/lib/auth";

const schema = z.object({
  variantId: z.uuid(),
  quantity: z.number().int().min(0).max(1_000_000),
  reason: z.enum(["restock", "correction", "damaged", "other"]),
  note: z.string().trim().max(200),
});

export async function adjustStock(raw: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "You are not authorised to do this." };
  const p = schema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Enter a valid quantity (0 or more, whole numbers)." };
  const { error } = await admin.supabase.rpc("admin_adjust_stock", {
    p_variant_id: p.data.variantId, p_new_qty: p.data.quantity, p_reason: p.data.reason, p_note: p.data.note,
  });
  if (error) return { ok: false, error: "Couldn't update stock. Please try again." };
  updateTag("products");
  return { ok: true };
}
