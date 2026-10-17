import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/server";

/** Returns the signed-in admin (session client + user) or null. Role comes from the profiles table only. */
export async function getAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return profile?.role === "admin" ? { user, supabase } : null;
}

export async function requireAdmin() {
  // Admin pages are always rendered per request. Supabase auth reads the clock (Date.now),
  // which Cache Components disallows during prerendering and runtime prefetching.
  await connection();
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
