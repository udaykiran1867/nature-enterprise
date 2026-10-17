-- Phase 3 & 4: ordering function, public settings, storage bucket, admin save function

-- ---------- settings ----------
create policy "public read settings" on store_settings for select
  using (key in ('delivery_fee', 'announcement'));
insert into store_settings (key, value) values ('delivery_fee', '0'::jsonb)
  on conflict (key) do nothing;

-- ---------- storage: product images ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = 5242880, allowed_mime_types = excluded.allowed_mime_types;

create policy "admin read product images" on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
create policy "admin insert product images" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
create policy "admin update product images" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
create policy "admin delete product images" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- ---------- order JSON helper ----------
create or replace function public._order_json(p_id uuid, p_replayed boolean)
returns jsonb language sql stable set search_path = public as $$
  select jsonb_build_object(
    'order_id', o.id, 'order_number', o.order_number, 'access_token', o.access_token,
    'subtotal', o.subtotal, 'delivery_fee', o.delivery_fee, 'total', o.total, 'replayed', p_replayed,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', i.product_name_snapshot, 'pack', i.pack_size_snapshot,
        'unit_price', i.unit_price, 'quantity', i.quantity, 'line_total', i.line_total
      ) order by i.product_name_snapshot, i.pack_size_snapshot)
      from order_items i where i.order_id = o.id
    ), '[]'::jsonb)
  ) from orders o where o.id = p_id
$$;

-- ---------- atomic order creation ----------
-- Stock policy: stock is decremented when the order is submitted (reserved). Restocking on
-- cancellation is handled by the admin order workflow (Phase 5).
create or replace function public.create_order(p_idempotency_key text, p_customer jsonb, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_id uuid; v_number text; v_attempt int := 0; v_constraint text;
  v_subtotal numeric(10,2) := 0; v_fee numeric(10,2); v_lines jsonb := '[]'::jsonb;
  v_phone text := p_customer->>'phone';
  r record; v record; l jsonb; v_pack text; v_line numeric(10,2);
begin
  if p_idempotency_key is null or length(p_idempotency_key) < 8 then raise exception 'invalid_request'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 30 then raise exception 'invalid_request'; end if;

  select id into v_id from orders where idempotency_key = p_idempotency_key;
  if found then return public._order_json(v_id, true); end if;

  if (select count(*) from orders where customer_phone = v_phone and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'rate_limited';
  end if;

  -- Lock variants in a stable order (prevents deadlocks and overselling)
  for r in
    select (e->>'variant_id')::uuid as vid, sum((e->>'quantity')::int) as qty
    from jsonb_array_elements(p_items) e group by 1 order by 1
  loop
    if r.qty < 1 or r.qty > 50 then raise exception 'invalid_request'; end if;
    select pv.id, pv.price, pv.stock_quantity, pv.is_available, pv.pack_size, pv.unit, p.name, p.is_active
      into v
      from product_variants pv join products p on p.id = pv.product_id
      where pv.id = r.vid for update of pv;
    if not found or not v.is_active or not v.is_available then
      raise exception 'unavailable:%', coalesce(v.name, 'An item');
    end if;
    if v.stock_quantity < r.qty then
      raise exception 'out_of_stock:%', v.name;
    end if;
    v_pack := trim(trailing '.' from trim(trailing '0' from v.pack_size::text)) || ' ' || v.unit;
    v_line := v.price * r.qty;
    v_subtotal := v_subtotal + v_line;
    v_lines := v_lines || jsonb_build_object('variant_id', v.id, 'name', v.name, 'pack', v_pack,
                                             'price', v.price, 'qty', r.qty, 'line', v_line);
  end loop;

  select coalesce((value #>> '{}')::numeric, 0) into v_fee from store_settings where key = 'delivery_fee';
  v_fee := coalesce(v_fee, 0);

  loop
    v_number := 'NE-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    begin
      insert into orders (order_number, customer_name, customer_phone, delivery_address, landmark, city, state,
                          postal_code, customer_notes, subtotal, delivery_fee, total, idempotency_key)
      values (v_number, p_customer->>'name', v_phone, p_customer->>'address', nullif(p_customer->>'landmark', ''),
              p_customer->>'city', p_customer->>'state', p_customer->>'postal_code', nullif(p_customer->>'notes', ''),
              v_subtotal, v_fee, v_subtotal + v_fee, p_idempotency_key)
      returning id into v_id;
      exit;
    exception when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;
      if v_constraint = 'orders_idempotency_key_key' then
        select id into v_id from orders where idempotency_key = p_idempotency_key;
        return public._order_json(v_id, true);
      end if;
      v_attempt := v_attempt + 1;
      if v_attempt >= 5 then raise; end if;
    end;
  end loop;

  for l in select * from jsonb_array_elements(v_lines) loop
    insert into order_items (order_id, product_variant_id, product_name_snapshot, pack_size_snapshot, unit_price, quantity, line_total)
    values (v_id, (l->>'variant_id')::uuid, l->>'name', l->>'pack', (l->>'price')::numeric, (l->>'qty')::int, (l->>'line')::numeric);
    update product_variants set stock_quantity = stock_quantity - (l->>'qty')::int, updated_at = now()
      where id = (l->>'variant_id')::uuid;
  end loop;

  return public._order_json(v_id, false);
end $$;

revoke all on function public.create_order(text, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public._order_json(uuid, boolean) from public, anon, authenticated;
grant execute on function public.create_order(text, jsonb, jsonb) to service_role;
grant execute on function public._order_json(uuid, boolean) to service_role;

-- ---------- admin: save product + variants in one transaction ----------
-- security invoker: Row Level Security (admin-only write policies) still applies.
create or replace function public.admin_save_product(p_id uuid, p_product jsonb, p_variants jsonb)
returns uuid language plpgsql security invoker set search_path = public as $$
declare v_id uuid := p_id; v_keep uuid[] := array[]::uuid[]; e jsonb; vid uuid;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;

  if v_id is null then
    insert into products (name, slug, description, category_id, image_path, image_alt, is_active, is_featured, seo_title, seo_description)
    values (p_product->>'name', p_product->>'slug', nullif(p_product->>'description', ''),
            nullif(p_product->>'category_id', '')::uuid, nullif(p_product->>'image_path', ''), nullif(p_product->>'image_alt', ''),
            coalesce((p_product->>'is_active')::boolean, false), coalesce((p_product->>'is_featured')::boolean, false),
            nullif(p_product->>'seo_title', ''), nullif(p_product->>'seo_description', ''))
    returning id into v_id;
  else
    update products set
      name = p_product->>'name', slug = p_product->>'slug', description = nullif(p_product->>'description', ''),
      category_id = nullif(p_product->>'category_id', '')::uuid, image_path = nullif(p_product->>'image_path', ''),
      image_alt = nullif(p_product->>'image_alt', ''), is_active = coalesce((p_product->>'is_active')::boolean, false),
      is_featured = coalesce((p_product->>'is_featured')::boolean, false),
      seo_title = nullif(p_product->>'seo_title', ''), seo_description = nullif(p_product->>'seo_description', ''),
      updated_at = now()
    where id = v_id;
    if not found then raise exception 'not_found'; end if;
  end if;

  for e in select * from jsonb_array_elements(p_variants) loop
    vid := nullif(e->>'id', '')::uuid;
    if vid is not null and exists (select 1 from product_variants where id = vid and product_id = v_id) then
      update product_variants set pack_size = (e->>'pack_size')::numeric, unit = e->>'unit', sku = nullif(e->>'sku', ''),
        price = (e->>'price')::numeric, stock_quantity = (e->>'stock_quantity')::int,
        low_stock_threshold = (e->>'low_stock_threshold')::int, is_available = (e->>'is_available')::boolean,
        updated_at = now()
      where id = vid;
    else
      insert into product_variants (product_id, pack_size, unit, sku, price, stock_quantity, low_stock_threshold, is_available)
      values (v_id, (e->>'pack_size')::numeric, e->>'unit', nullif(e->>'sku', ''), (e->>'price')::numeric,
              (e->>'stock_quantity')::int, (e->>'low_stock_threshold')::int, (e->>'is_available')::boolean)
      returning id into vid;
    end if;
    v_keep := v_keep || vid;
  end loop;

  delete from product_variants where product_id = v_id and not (id = any (v_keep));
  return v_id;
end $$;

revoke all on function public.admin_save_product(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.admin_save_product(uuid, jsonb, jsonb) to authenticated;
