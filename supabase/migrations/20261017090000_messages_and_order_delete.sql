-- Contact messages (written only by the server with the service role; read/managed by admins)
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists contact_messages_created_idx on contact_messages (created_at desc);
alter table contact_messages enable row level security;
create policy "admin all messages" on contact_messages for all using (is_admin()) with check (is_admin());

-- Delete an order. If it still holds reserved stock (not shipped/delivered/cancelled), the stock is returned first.
create or replace function public.admin_delete_order(p_order_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
declare o orders%rowtype; l record;
begin
  perform public._assert_admin_or_system();
  select * into o from orders where id = p_order_id for update;
  if not found then raise exception 'not_found'; end if;

  if not o.stock_released and o.order_status in ('submitted', 'awaiting_confirmation', 'confirmed', 'processing') then
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

revoke all on function public.admin_delete_order(uuid) from public, anon;
grant execute on function public.admin_delete_order(uuid) to authenticated;
