-- UPI payment details (UPI ID + QR image path), editable in Admin > Settings.
-- The customer payment page reads them with the public (anon) client, so the key must be publicly readable.
-- The QR image itself is stored in the existing public 'product-images' bucket under payment/.
drop policy if exists "public read settings" on store_settings;
create policy "public read settings" on store_settings for select
  using (key in ('delivery_fee', 'announcement', 'business', 'payment'));

insert into store_settings (key, value) values
  ('payment', '{"upiId":"","qrImage":""}'::jsonb)
on conflict (key) do nothing;
