# Nature Enterprises: Spice E-commerce

Next.js (App Router) + Supabase + Tailwind. Phases 1 and 2 are included: foundation, design system, database schema, and the public storefront (home, catalogue, product detail, add to cart).

## Setup
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in your Supabase URL and anon key. Leave `WHATSAPP_BUSINESS_NUMBER` as the placeholder until you have the real number (digits only, e.g. `919876543210`).
3. Apply the schema: `npx supabase link --project-ref <ref>` then `npx supabase db push`.
4. (Dev only) Paste `supabase/seed.sql` into the Supabase SQL Editor for placeholder products. The prices in it are fixtures, not real pricing.
5. `npm run dev`, then open http://localhost:3000.

## Notes
- Public catalogue reads use a cookie-less anon client and are cached (`"use cache"`, tags `products` / `categories`). Admin changes in Phase 4 will revalidate these tags.
- Product images: put files in a public Supabase Storage bucket named `product-images` and store the path in `products.image_path` (Phase 4 adds uploads). A full `https://` URL also works.
- The hero image slot is `SITE.heroImage` in `src/lib/site.ts`. Business contact placeholders live in the same file.
- Prices in the cart are for display only. The server recalculates everything at checkout (Phase 3).
