"use server";

import { z } from "zod";
import { getAdmin } from "@/lib/auth";

type R = { ok: true } | { ok: false; error: string };
const id = z.uuid();

export async function setMessageRead(messageId: string, read: boolean): Promise<R> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "You are not authorised to do this." };
  if (!id.safeParse(messageId).success) return { ok: false, error: "Invalid request." };
  const { error } = await admin.supabase.from("contact_messages").update({ is_read: read }).eq("id", messageId);
  return error ? { ok: false, error: "Couldn't update the message." } : { ok: true };
}

export async function deleteMessage(messageId: string): Promise<R> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "You are not authorised to do this." };
  if (!id.safeParse(messageId).success) return { ok: false, error: "Invalid request." };
  const { error } = await admin.supabase.from("contact_messages").delete().eq("id", messageId);
  return error ? { ok: false, error: "Couldn't delete the message." } : { ok: true };
}
