import "server-only";
import { createAdminClient } from "@/lib/admin";
import { UPI_ID_RE } from "@/lib/payments";

/** The business UPI account. Private: read on the server only, never through the public API. */
export async function getUpiAccount(): Promise<{ upiId: string; payeeName: string } | null> {
  const { data } = await createAdminClient().from("store_settings").select("value").eq("key", "upi_account").maybeSingle();
  const v = (data?.value ?? {}) as { upi_id?: string; payee_name?: string };
  const upiId = (v.upi_id ?? "").trim();
  if (!UPI_ID_RE.test(upiId)) return null;
  return { upiId, payeeName: (v.payee_name ?? "").trim() || "Nature Enterprises" };
}
