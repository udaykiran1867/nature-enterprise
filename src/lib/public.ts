import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

/** Cookie-less anon client for public catalogue reads (safe to use inside "use cache"). */
export function createPublicClient() {
  return createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
