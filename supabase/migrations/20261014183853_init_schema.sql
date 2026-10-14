create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text unique not null,
  description text, image_url text,
  is_active boolean not null default true,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text unique not null, description text,
  category_id uuid references categories(id),
  image_path text, image_alt text,
  is_active boolean not null default false,
  is_featured boolean not null default false,
  seo_title text, seo_description text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  pack_size numeric not null, unit text not null, sku text unique,
  price numeric(10,2) not null check (price >= 0),
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  low_stock_threshold int not null default 5,
  is_available boolean not null default true,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  unique (product_id, pack_size, unit)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_name text not null, customer_phone text not null,
  delivery_address text not null, landmark text,
  city text not null, state text not null, postal_code text not null,
  customer_notes text,
  subtotal numeric(10,2) not null, delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  order_status text not null default 'submitted',
  whatsapp_handoff_status text not null default 'pending',
  idempotency_key text unique,
  access_token text not null default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_variant_id uuid references product_variants(id) on delete set null,
  product_name_snapshot text not null, pack_size_snapshot text not null,
  unit_price numeric(10,2) not null, quantity int not null check (quantity > 0),
  line_total numeric(10,2) not null
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer'
);

create table store_settings (key text primary key, value jsonb not null);

create index on products (category_id);
create index on product_variants (product_id);
create index on orders (created_at desc);

create function is_admin() returns boolean
language sql security definer stable set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and role = 'admin') $$;

alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table profiles enable row level security;
alter table store_settings enable row level security;

create policy "public read categories" on categories for select using (is_active);
create policy "public read products" on products for select using (is_active);
create policy "public read variants" on product_variants for select
  using (exists (select 1 from products p where p.id = product_id and p.is_active));
create policy "admin all categories" on categories for all using (is_admin()) with check (is_admin());
create policy "admin all products" on products for all using (is_admin()) with check (is_admin());
create policy "admin all variants" on product_variants for all using (is_admin()) with check (is_admin());
create policy "admin all orders" on orders for all using (is_admin()) with check (is_admin());
create policy "admin all order_items" on order_items for all using (is_admin()) with check (is_admin());
create policy "own profile" on profiles for select using (id = auth.uid());
create policy "admin settings" on store_settings for all using (is_admin()) with check (is_admin());