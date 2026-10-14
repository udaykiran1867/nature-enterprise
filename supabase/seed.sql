-- DEV FIXTURES ONLY: placeholder names, descriptions and prices.
-- These are NOT the client's real products or pricing. Replace them from the admin panel.
insert into categories (name, slug) values
  ('Powders', 'powders'),
  ('Blended Masalas', 'blended-masalas')
on conflict (slug) do nothing;

with new_products as (
  insert into products (name, slug, description, category_id, is_active, is_featured)
  select v.name, v.slug, v.descr, c.id, true, true
  from (values
    ('Turmeric Powder',   'turmeric-powder',   '[Dev placeholder description]', 'powders'),
    ('Red Chilli Powder', 'red-chilli-powder', '[Dev placeholder description]', 'powders'),
    ('Garam Masala',      'garam-masala',      '[Dev placeholder description]', 'blended-masalas')
  ) as v(name, slug, descr, cat)
  join categories c on c.slug = v.cat
  on conflict (slug) do nothing
  returning id
)
insert into product_variants (product_id, pack_size, unit, price, stock_quantity)
select p.id, s.size, s.unit, s.price, 20
from new_products p
cross join (values (50, 'g', 10), (100, 'g', 20), (1, 'kg', 200)) as s(size, unit, price);
