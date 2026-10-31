# Nature Enterprises: Spice E-commerce

Next.js 16 (App Router) + Supabase + Tailwind. Included so far: foundation and design system (Phase 1), public storefront (Phase 2), cart, checkout, server-side ordering and WhatsApp handoff (Phase 3), admin login, product management and image upload (Phase 4), inventory with stock history, order management, business settings, a contact form with an admin inbox, and paginated shop/admin lists (Phase 5).

## Setup
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the values (Supabase URL, anon key, **service role key**, and `WHATSAPP_BUSINESS_NUMBER` as digits only, e.g. `919876543210`). Never commit `.env.local`, and never expose the service role key to the browser.
3. Apply the database schema: `npx supabase link --project-ref <ref>` then `npx supabase db push` (applies all migrations: schema, ordering functions, the `product-images` storage bucket, inventory/order workflow functions).
4. Optional dev data: paste `supabase/seed.sql` into the Supabase SQL Editor (placeholder products and prices, not real pricing).
5. `npm run dev`, then open http://localhost:3000

## Create the first admin (secure, one time)
1. Supabase Dashboard > Authentication > Users > **Add user** (email + password, tick "Auto confirm").
2. Supabase Dashboard > Authentication > Providers/Settings: **disable public sign-ups**.
3. In the SQL Editor run (use that user's id from the Users page):
   ```sql
   insert into profiles (id, role) values ('<USER_UUID>', 'admin')
   on conflict (id) do update set role = 'admin';
   ```
4. Sign in at `/admin/login`. Admin rights come only from the `profiles` table, which users cannot edit themselves.

## How ordering works
- Customers browse and order without an account. Checkout calls a server action, which calls the database function `create_order` (service role only).
- The database re-reads prices and stock, locks the variant rows, rejects unavailable or oversold items, writes the order and item snapshots, and decrements stock, all in one transaction. A per-cart idempotency key prevents duplicate orders, and each phone number is limited to 5 orders per hour.
- The server builds the WhatsApp message from the saved order and opens `https://wa.me/<number>?text=...`. The customer must press **Send** in WhatsApp. The confirmation page has "Open WhatsApp" and "Copy order message" fallbacks.
- **Stock policy:** stock is reserved (decremented) when the order is submitted. Cancelling an order returns its stock exactly once. Orders still `Submitted` with no WhatsApp confirmation after 48 hours can be released from **Admin > Orders > Release unconfirmed stock**.
- **Order lifecycle:** New order > Payment > Confirmed > Dispatched > Delivered; any order before Dispatched can be Cancelled. Delivered and Cancelled are final. Every change is stored in the order timeline. A saved order stays distinguishable from a WhatsApp-confirmed one: use **Mark message as received** on the order page.
- **Payment step:** moving an order to **Payment** opens a WhatsApp message asking the customer to pay (no amount, they already know it) and to send the payment screenshot. The message links to `/pay`, a page that says "Pay now!" and shows your QR code with a name under it. Upload the QR image (and optionally the name) once in **Admin > Settings > Payment QR**. When the screenshot arrives, move the order to **Confirmed**. The link needs `NEXT_PUBLIC_SITE_URL` to be your live domain, and run the migration `20261031100000_payment_settings.sql`.
- **Deleting an order** (Admin > Orders) asks for confirmation. If the order hasn't shipped, its reserved stock returns to inventory first; shipped and delivered orders don't change stock.
- **Messages** (Admin > Messages): contact-form messages with search and date / month / year filters, mark read, reply by email or WhatsApp, delete. The public form has a hidden spam trap and a limit of 3 messages per email per hour.
- **Page sizes:** shop 12 products, inventory 20 pack sizes (last 10 stock changes), orders 25, messages 20.
- **Settings** (Admin > Settings): business phone/email/address, WhatsApp number (overrides the env value), delivery fee, default low-stock threshold, store announcement banner.
- Optional automatic release: in Supabase SQL Editor run `create extension if not exists pg_cron;` then `select cron.schedule('release-stale-orders', '0 * * * *', $$select public.release_stale_orders(48)$$);`

## Notes
- Catalogue reads are cached with tags (`products`, `categories`, `settings`); admin saves refresh them immediately.
- Product images live in the public `product-images` bucket (JPG/PNG/WebP, max 5 MB, enforced by the bucket). Only admins can upload or delete.
- Placeholders for business phone, email, address and the brand story live in `src/lib/site.ts` and the About page.
- Admin routes are protected by `src/proxy.ts` (session), server-side role checks on every page and action, and database RLS.
