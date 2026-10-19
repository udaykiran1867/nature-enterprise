-- Optional "How to use" content (text and/or YouTube / Instagram links) for each product.
alter table products add column if not exists how_to_use text;

create or replace function public.admin_save_product(p_id uuid, p_product jsonb, p_variants jsonb)
returns uuid language plpgsql security invoker set search_path = public as $$
declare v_id uuid := p_id; v_keep uuid[] := array[]::uuid[]; e jsonb; vid uuid;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;

  if v_id is null then
    insert into products (name, slug, description, category_id, image_path, image_alt, is_active, is_featured, seo_title, seo_description, how_to_use)
    values (p_product->>'name', p_product->>'slug', nullif(p_product->>'description', ''),
            nullif(p_product->>'category_id', '')::uuid, nullif(p_product->>'image_path', ''), nullif(p_product->>'image_alt', ''),
            coalesce((p_product->>'is_active')::boolean, false), coalesce((p_product->>'is_featured')::boolean, false),
            nullif(p_product->>'seo_title', ''), nullif(p_product->>'seo_description', ''), nullif(p_product->>'how_to_use', ''))
    returning id into v_id;
  else
    update products set
      name = p_product->>'name', slug = p_product->>'slug', description = nullif(p_product->>'description', ''),
      category_id = nullif(p_product->>'category_id', '')::uuid, image_path = nullif(p_product->>'image_path', ''),
      image_alt = nullif(p_product->>'image_alt', ''), is_active = coalesce((p_product->>'is_active')::boolean, false),
      is_featured = coalesce((p_product->>'is_featured')::boolean, false),
      seo_title = nullif(p_product->>'seo_title', ''), seo_description = nullif(p_product->>'seo_description', ''),
      how_to_use = nullif(p_product->>'how_to_use', ''),
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
