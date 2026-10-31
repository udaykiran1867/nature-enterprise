-- Order lifecycle change: Payment > Confirmed > Dispatched (db value 'shipped') > Delivered
-- The old 'processing' and 'awaiting_confirmation' statuses are retired.

-- 1. Move existing orders onto the new statuses (before the constraint is replaced).
--    processing            -> confirmed  (already confirmed, was being prepared)
--    awaiting_confirmation -> payment    (still waiting on the customer)
-- Past entries in order_status_history are left untouched; they remain a record of what happened.
update orders set order_status = 'confirmed', updated_at = now() where order_status = 'processing';
update orders set order_status = 'payment',   updated_at = now() where order_status = 'awaiting_confirmation';

alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check check (order_status in
  ('submitted','payment','confirmed','shipped','delivered','cancelled'));

-- 2. New transition rules.
--   submitted -> payment | confirmed | cancelled
--   payment   -> confirmed | cancelled
--   confirmed -> shipped | cancelled
--   shipped   -> delivered
--   delivered, cancelled: final.   Cancelling returns reserved stock exactly once.
create or replace function public.admin_set_order_status(p_order_id uuid, p_status text, p_note text)
returns text language plpgsql security invoker set search_path = public as $$
declare o orders%rowtype; ok boolean; l record;
begin
  perform public._assert_admin_or_system();
  select * into o from orders where id = p_order_id for update;
  if not found then raise exception 'not_found'; end if;

  ok := case o.order_status
    when 'submitted' then p_status in ('payment', 'confirmed', 'cancelled')
    when 'payment' then p_status in ('confirmed', 'cancelled')
    when 'confirmed' then p_status in ('shipped', 'cancelled')
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

-- 3. Deleting an order returns reserved stock while the order is not yet dispatched.
create or replace function public.admin_delete_order(p_order_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
declare o orders%rowtype; l record;
begin
  perform public._assert_admin_or_system();
  select * into o from orders where id = p_order_id for update;
  if not found then raise exception 'not_found'; end if;

  if not o.stock_released and o.order_status in ('submitted', 'payment', 'confirmed') then
    for l in select product_variant_id, quantity, product_name_snapshot, pack_size_snapshot
             from order_items where order_id = o.id and product_variant_id is not null
    loop
      update product_variants set stock_quantity = stock_quantity + l.quantity, updated_at = now()
        where id = l.product_variant_id;
      insert into inventory_movements (variant_id, product_name, pack_label, change, reason, note, admin_id)
      values (l.product_variant_id, l.product_name_snapshot, l.pack_size_snapshot, l.quantity,
              'order_deleted', o.order_number, auth.uid());
    end loop;
  end if;

  delete from orders where id = o.id;
end $$;

-- Re-assert permissions (create or replace keeps them; this is just a safety net).
revoke all on function public.admin_set_order_status(uuid, text, text) from public, anon;
revoke all on function public.admin_delete_order(uuid) from public, anon;
grant execute on function public.admin_set_order_status(uuid, text, text) to authenticated;
grant execute on function public.admin_delete_order(uuid) to authenticated;
