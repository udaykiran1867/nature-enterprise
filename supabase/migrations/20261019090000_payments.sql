-- Payments: Cash on Delivery and manual UPI (the admin confirms UPI payments by hand)

-- ---------- orders: payment columns ----------
alter table orders add column if not exists payment_method text;            -- null for orders placed before payments existed
alter table orders add column if not exists payment_status text not null default 'pending';
alter table orders add column if not exists payment_reference text;         -- UPI transaction ID, entered by the admin
alter table orders add column if not exists paid_at timestamptz;
alter table orders add column if not exists refunded_at timestamptz;
alter table orders drop constraint if exists orders_payment_method_check;
alter table orders add constraint orders_payment_method_check check (payment_method is null or payment_method in ('cod', 'upi'));
alter table orders drop constraint if exists orders_payment_status_check;
alter table orders add constraint orders_payment_status_check check (payment_status in ('pending', 'paid', 'refunded'));
create index if not exists orders_payment_idx on orders (payment_status, created_at desc);

-- ---------- settings ----------
-- payment_options is public (which methods exist). upi_account stays private: only admins and the server can read it.
drop policy if exists "public read settings" on store_settings;
create policy "public read settings" on store_settings for select
  using (key in ('delivery_fee', 'announcement', 'business', 'payment_options'));
insert into store_settings (key, value) values
  ('payment_options', '{"cod_enabled":true,"upi_enabled":false,"cod_max_amount":0}'::jsonb),
  ('upi_account', '{"upi_id":"","payee_name":""}'::jsonb)
on conflict (key) do nothing;

-- ---------- order JSON now includes payment ----------
create or replace function public._order_json(p_id uuid, p_replayed boolean)
returns jsonb language sql stable set search_path = public as $$
  select jsonb_build_object(
    'order_id', o.id, 'order_number', o.order_number, 'access_token', o.access_token,
    'subtotal', o.subtotal, 'delivery_fee', o.delivery_fee, 'total', o.total, 'replayed', p_replayed, 'payment_method', o.payment_method, 'payment_status', o.payment_status,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', i.product_name_snapshot, 'pack', i.pack_size_snapshot,
        'unit_price', i.unit_price, 'quantity', i.quantity, 'line_total', i.line_total
      ) order by i.product_name_snapshot, i.pack_size_snapshot)
      from order_items i where i.order_id = o.id
    ), '[]'::jsonb)
  ) from orders o where o.id = p_id
$$;

-- ---------- order creation with a payment method ----------
drop function if exists public.create_order(text, jsonb, jsonb);
create or replace function public.create_order(p_idempotency_key text, p_customer jsonb, p_items jsonb, p_payment_method text default 'cod')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_id uuid; v_number text; v_attempt int := 0; v_constraint text;
  v_subtotal numeric(10,2) := 0; v_fee numeric(10,2); v_lines jsonb := '[]'::jsonb;
  v_phone text := p_customer->>'phone';
  v_opts jsonb; v_cap numeric;
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
    v_pack := trim_scale(v.pack_size)::text || ' ' || v.unit;
    v_line := v.price * r.qty;
    v_subtotal := v_subtotal + v_line;
    v_lines := v_lines || jsonb_build_object('variant_id', v.id, 'name', v.name, 'pack', v_pack,
                                             'price', v.price, 'qty', r.qty, 'line', v_line);
  end loop;

  select coalesce((value #>> '{}')::numeric, 0) into v_fee from store_settings where key = 'delivery_fee';
  v_fee := coalesce(v_fee, 0);

  -- Payment method must be enabled by the admin (UPI also needs a UPI ID); COD can have a maximum order amount.
  if p_payment_method is null or p_payment_method not in ('cod', 'upi') then raise exception 'invalid_request'; end if;
  select value into v_opts from store_settings where key = 'payment_options';
  v_opts := coalesce(v_opts, '{"cod_enabled":true,"upi_enabled":false,"cod_max_amount":0}'::jsonb);
  if p_payment_method = 'cod' then
    if not coalesce((v_opts->>'cod_enabled')::boolean, true) then raise exception 'payment_unavailable:cod'; end if;
    v_cap := coalesce((v_opts->>'cod_max_amount')::numeric, 0);
    if v_cap > 0 and v_subtotal + v_fee > v_cap then raise exception 'cod_limit:%', v_cap; end if;
  else
    if not coalesce((v_opts->>'upi_enabled')::boolean, false)
       or coalesce(trim((select value->>'upi_id' from store_settings where key = 'upi_account')), '') = '' then
      raise exception 'payment_unavailable:upi';
    end if;
  end if;

  loop
    v_number := 'NE-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    begin
      insert into orders (order_number, customer_name, customer_phone, delivery_address, landmark, city, state,
                          postal_code, customer_notes, subtotal, delivery_fee, total, idempotency_key, payment_method)
      values (v_number, p_customer->>'name', v_phone, p_customer->>'address', nullif(p_customer->>'landmark', ''),
              p_customer->>'city', p_customer->>'state', p_customer->>'postal_code', nullif(p_customer->>'notes', ''),
              v_subtotal, v_fee, v_subtotal + v_fee, p_idempotency_key, p_payment_method)
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
    insert into inventory_movements (variant_id, product_name, pack_label, change, reason, order_id, note)
    values ((l->>'variant_id')::uuid, l->>'name', l->>'pack', -(l->>'qty')::int, 'order', v_id, v_number);
  end loop;

  return public._order_json(v_id, false);
end $$;

revoke all on function public.create_order(text, jsonb, jsonb, text) from public, anon, authenticated;
revoke all on function public._order_json(uuid, boolean) from public, anon, authenticated;
grant execute on function public.create_order(text, jsonb, jsonb, text) to service_role;
grant execute on function public._order_json(uuid, boolean) to service_role;

-- ---------- admin: change payment status ----------
-- pending -> paid; paid -> pending (undo a mistake) or refunded; refunded is final.
create or replace function public.admin_set_payment(p_order_id uuid, p_status text, p_reference text)
returns text language plpgsql security invoker set search_path = public as $$
declare o orders%rowtype; ok boolean;
begin
  perform public._assert_admin_or_system();
  select * into o from orders where id = p_order_id for update;
  if not found then raise exception 'not_found'; end if;
  if o.payment_method is null then raise exception 'no_payment_method'; end if;

  ok := case o.payment_status
    when 'pending' then p_status = 'paid'
    when 'paid' then p_status in ('pending', 'refunded')
    else false end;
  if not ok then raise exception 'invalid_transition:% -> %', o.payment_status, p_status; end if;
  if p_status = 'paid' and o.order_status = 'cancelled' then raise exception 'order_cancelled'; end if;

  update orders set
    payment_status = p_status,
    payment_reference = case p_status when 'paid' then nullif(left(trim(coalesce(p_reference, '')), 80), '')
                                      when 'pending' then null else payment_reference end,
    paid_at = case p_status when 'paid' then now() when 'pending' then null else paid_at end,
    refunded_at = case when p_status = 'refunded' then now() else refunded_at end,
    updated_at = now()
  where id = o.id;
  return p_status;
end $$;

revoke all on function public.admin_set_payment(uuid, text, text) from public, anon;
grant execute on function public.admin_set_payment(uuid, text, text) to authenticated;

-- ---------- release: also free stock held by unpaid UPI orders that were never confirmed ----------
create or replace function public.release_stale_orders(p_hours int default 48)
returns int language plpgsql security invoker set search_path = public as $$
declare r record; n int := 0;
begin
  perform public._assert_admin_or_system();
  for r in select id from orders
    where order_status = 'submitted' and payment_status <> 'paid'
      and (whatsapp_handoff_status = 'pending' or (payment_method = 'upi' and payment_status = 'pending'))
      and created_at < now() - make_interval(hours => greatest(p_hours, 1))
  loop
    perform public.admin_set_order_status(r.id, 'cancelled', 'Auto-released: not confirmed within ' || p_hours || ' hours');
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.release_stale_orders(int) from public, anon;
grant execute on function public.release_stale_orders(int) to authenticated;
