"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdmin } from "@/lib/auth";
import { createClient } from "@/lib/server";

const credentials = z.object({ email: z.email().max(200), password: z.string().min(1).max(200) });

export async function signIn(raw: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = credentials.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Enter a valid email and password." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: "Invalid email or password." };
  if (!(await getAdmin())) {
    await supabase.auth.signOut();
    return { ok: false, error: "This account doesn't have admin access." };
  }
  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
