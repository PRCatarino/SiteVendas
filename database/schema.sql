create extension if not exists pgcrypto;

create table if not exists products (
  id text primary key,
  slug text not null unique,
  name text not null,
  brand text not null default 'Catarino Prime',
  category text not null,
  sku text not null,
  code text not null,
  description text not null,
  price numeric(10, 2) not null,
  old_price numeric(10, 2),
  stock integer not null default 0,
  rating numeric(2, 1) not null default 5,
  review_count integer not null default 0,
  image_key text not null,
  image_url text,
  gallery_images jsonb not null default '[]'::jsonb,
  is_featured boolean not null default false,
  is_kit boolean not null default false,
  specs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table products add column if not exists image_url text;
alter table products add column if not exists gallery_images jsonb not null default '[]'::jsonb;
alter table products add column if not exists source text not null default 'local';
alter table products add column if not exists external_product_id text;
alter table products add column if not exists affiliate_url text;
alter table products add column if not exists supplier_cost numeric(10, 2);
alter table products add column if not exists supplier_currency text not null default 'BRL';
alter table products add column if not exists markup_percent numeric(7, 2) not null default 40;
alter table products add column if not exists freight_estimate numeric(10, 2);
alter table products add column if not exists sync_status text not null default 'manual';
alter table products add column if not exists external_payload jsonb not null default '{}'::jsonb;
alter table products add column if not exists synced_at timestamptz;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  phone text not null,
  cpf text,
  created_at timestamptz not null default now()
);

create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  cep text not null,
  street text not null,
  number text not null,
  complement text,
  neighborhood text not null,
  city text not null,
  state text not null,
  created_at timestamptz not null default now()
);

create table if not exists user_sessions (
  token_hash text primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cart_items (
  cart_id uuid not null references carts(id) on delete cascade,
  product_id text not null references products(id),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (cart_id, product_id)
);

create table if not exists coupons (
  code text primary key,
  description text not null,
  type text not null check (type in ('percent', 'fixed')),
  value numeric(10, 2) not null,
  min_total numeric(10, 2) not null default 0,
  active boolean not null default true
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  cart_id uuid,
  subtotal numeric(10, 2) not null,
  discount numeric(10, 2) not null default 0,
  freight numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  cep text,
  coupon_code text references coupons(code),
  status text not null default 'created',
  created_at timestamptz not null default now()
);

alter table orders add column if not exists user_id uuid references users(id);
alter table orders add column if not exists payment_provider text;
alter table orders add column if not exists provider_preference_id text;
alter table orders add column if not exists paid_at timestamptz;

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  provider text not null default 'mercado_pago',
  provider_payment_id text,
  provider_preference_id text,
  status text not null default 'pending',
  amount numeric(10, 2) not null,
  currency text not null default 'BRL',
  checkout_url text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_order_id_idx on payments(order_id);
create index if not exists payments_provider_payment_id_idx on payments(provider_payment_id);
create index if not exists payments_provider_preference_id_idx on payments(provider_preference_id);

create table if not exists order_items (
  order_id uuid not null references orders(id) on delete cascade,
  product_id text not null references products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null,
  primary key (order_id, product_id)
);

alter table order_items add column if not exists external_product_id text;
alter table order_items add column if not exists supplier_cost numeric(10, 2);
alter table order_items add column if not exists affiliate_url text;

create table if not exists order_fulfillments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  provider text not null default 'aliexpress',
  status text not null default 'pending_supplier_action',
  external_order_id text,
  tracking_code text,
  error_message text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists order_fulfillments_order_id_idx on order_fulfillments(order_id);
