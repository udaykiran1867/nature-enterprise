import { z } from "zod";

// NEXT_PUBLIC_* values must be referenced statically so Next can inline them.
const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url(),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
});

if (!parsed.success) {
  const bad = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
  throw new Error(`Missing or invalid environment variables: ${bad}. Check your .env.local file.`);
}

export const publicEnv = parsed.data;
