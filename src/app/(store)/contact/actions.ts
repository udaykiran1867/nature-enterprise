"use server";

import { createAdminClient } from "@/lib/admin";
import { contactSchema } from "@/schemas/contact";

export async function sendMessage(raw: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Please check the form and try again." };
  const v = parsed.data;
  if (v.website) return { ok: true }; // honeypot filled: pretend success, store nothing

  const db = createAdminClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await db.from("contact_messages").select("id", { count: "exact", head: true }).eq("email", v.email.toLowerCase()).gte("created_at", since);
  if ((count ?? 0) >= 3) return { ok: false, error: "You've sent a few messages recently. Please wait a while before sending another." };

  const phone = v.phone.replace(/\D/g, "").slice(-10);
  const { error } = await db.from("contact_messages").insert({
    name: v.name, email: v.email.toLowerCase(), phone: phone || null, subject: v.subject, message: v.message,
  });
  if (error) { console.error("contact insert failed:", error.message); return { ok: false, error: "We couldn't send your message. Please try again." }; }
  return { ok: true };
}
