-- Phase 5: inventory history, order workflow, business settings

-- ---------- tables ----------
create table if not exists inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid references product_variants(id) on delete set null,
  product_name text not null,
  pack_label text not null,
  change int not null,
  reason text not null,
  note text,
  order_id uuid references orders(id) on delete set null,
  admin_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists inventory_movements_created_idx on inventory_movements (created_at desc);

create table if not exists order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  admin_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists order_status_history_order_idx on order_status_history (order_id, created_at);

alter table orders add column if not exists stock_released boolean not null default false;
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check check (order_status in
  ('submitted','awaiting_confirmation','confirmed','processing','shipped','delivered','cancelled'));
alter table orders drop constraint if exists orders_handoff_check;
alter table orders add constraint orders_handoff_check check (whatsapp_handoff_status in ('pending','received'));
create index if not exists orders_status_idx on orders (order_status, created_at desc);

alter table inventory_movements enable row level security;
alter table order_status_history enable row level security;
create policy "admin read movements" on inventory_movements for select using (is_admin());
create policy "admin insert movements" on inventory_movements for insert with check (is_admin());
create policy "admin read order history" on order_status_history for select using (is_admin());
create policy "admin insert order history" on order_status_history for insert with check (is_admin());

-- ---------- settings ----------
drop policy if exists "public read settings" on store_settings;
create policy "public read settings" on store_settings for select
  using (key in ('delivery_fee', 'announcement', 'business'));
insert into store_settings (key, value) values
  ('business', '{"phone":"","email":"","address":"","whatsapp":""}'::jsonb),
  ('announcement', '""'::jsonb),
  ('low_stock_default', '5'::jsonb)
on conflict (key) do nothing;

-- ---------- create_order (now also logs inventory movements) ----------
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
    v_pack := trim_scale(v.pack_size)::text || ' ' || v.unit;
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
    insert into inventory_movements (variant_id, product_name, pack_label, change, reason, order_id, note)
    values ((l->>'variant_id')::uuid, l->>'name', l->>'pack', -(l->>'qty')::int, 'order', v_id, v_number);
  end loop;

  return public._order_json(v_id, false);
end $$;

revoke all on function public.create_order(text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_order(text, jsonb, jsonb) to service_role;

-- ---------- admin helpers ----------
-- Callable by a signed-in admin (RLS also applies) or by a trusted database job (no auth.uid()).
create or replace function public._assert_admin_or_system() returns void
language plpgsql stable set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then raise exception 'forbidden'; end if;
end $$;

create or replace function public.admin_adjust_stock(p_variant_id uuid, p_new_qty int, p_reason text, p_note text)
returns int language plpgsql security invoker set search_path = public as $$
declare v record; v_delta int;
begin
  perform public._assert_admin_or_system();
  if p_new_qty is null or p_new_qty < 0 then raise exception 'invalid_quantity'; end if;
  select pv.id, pv.stock_quantity, pv.pack_size, pv.unit, p.name into v
    from product_variants pv join products p on p.id = pv.product_id
    where pv.id = p_variant_id for update of pv;
  if not found then raise exception 'not_found'; end if;
  v_delta := p_new_qty - v.stock_quantity;
  if v_delta = 0 then return v.stock_quantity; end if;
  update product_variants set stock_quantity = p_new_qty, updated_at = now() where id = p_variant_id;
  insert into inventory_movements (variant_id, product_name, pack_label, change, reason, note, admin_id)
  values (v.id, v.name, trim_scale(v.pack_size)::text || ' ' || v.unit,
          v_delta, coalesce(nullif(p_reason, ''), 'correction'), nullif(p_note, ''), auth.uid());
  return p_new_qty;
end $$;

-- Order lifecycle:
--   submitted -> awaiting_confirmation | confirmed | cancelled
--   awaiting_confirmation -> confirmed | cancelled
--   confirmed -> processing | cancelled
--   processing -> shipped | cancelled
--   shipped -> delivered
--   delivered, cancelled: final.   Cancelling returns reserved stock exactly once.
create or replace function public.admin_set_order_status(p_order_id uuid, p_status text, p_note text)
returns text language plpgsql security invoker set search_path = public as $$
declare o orders%rowtype; ok boolean; l record;
begin
  perform public._assert_admin_or_system();
  select * into o from orders where id = p_order_id for update;
  if not found then raise exception 'not_found'; end if;

  ok := case o.order_status
    when 'submitted' then p_status in ('awaiting_confirmation', 'confirmed', 'cancelled')
    when 'awaiting_confirmation' then p_status in ('confirmed', 'cancelled')
    when 'confirmed' then p_status in ('processing', 'cancelled')
    when 'processing' then p_status in ('shipped', 'cancelled')
    when 'shipped' then p_status = 'delivered'
    else false end;
  if not ok then raise exception 'invalid_transition:% -> %', o.order_status, p_status; end if;

  if p_status = 'cancelled' and not o.stock_released then
    for l in select oi.product_variant_id, oi.quantity, oi.product_name_snapshot, oi.pack_size_snapshot
             from order_items oi where oi.order_id = o.id and oi.product_variant_id is not null
    loop
      update product_variants set stock_quantity = stock_quantity + l.quantity, updated_at = now()
        where id = l.product_variant_id;
      insert into inventory_movements (variant_id, product_name, pack_label, change, reason, order_id, note, admin_id)
      values (l.product_variant_id, l.product_name_snapshot, l.pack_size_snapshot, l.quantity,
              'order_cancelled', o.id, o.order_number, auth.uid());
    end loop;
    update orders set stock_released = true where id = o.id;
  end if;

  update orders set order_status = p_status, updated_at = now() where id = o.id;
  insert into order_status_history (order_id, from_status, to_status, note, admin_id)
  values (o.id, o.order_status, p_status, nullif(p_note, ''), auth.uid());
  return p_status;
end $$;

-- Releases stock held by orders that were saved but never confirmed (customer didn't press Send).
create or replace function public.release_stale_orders(p_hours int default 48)
returns int language plpgsql security invoker set search_path = public as $$
declare r record; n int := 0;
begin
  perform public._assert_admin_or_system();
  for r in select id from orders
    where order_status = 'submitted' and whatsapp_handoff_status = 'pending'
      and created_at < now() - make_interval(hours => greatest(p_hours, 1))
  loop
    perform public.admin_set_order_status(r.id, 'cancelled', 'Auto-released: not confirmed within ' || p_hours || ' hours');
    n := n + 1;
  end loop;
  return n;
end $$;

revoke all on function public._assert_admin_or_system() from public, anon;
revoke all on function public.admin_adjust_stock(uuid, int, text, text) from public, anon;
revoke all on function public.admin_set_order_status(uuid, text, text) from public, anon;
revoke all on function public.release_stale_orders(int) from public, anon;
grant execute on function public._assert_admin_or_system() to authenticated;
grant execute on function public.admin_adjust_stock(uuid, int, text, text) to authenticated;
grant execute on function public.admin_set_order_status(uuid, text, text) to authenticated;
grant execute on function public.release_stale_orders(int) to authenticated;
