-- Tafole core schema: tenancy, menu, tables, orders, service requests.
-- Row Level Security is defined in 20261124000200_rls.sql.

create type public.staff_role as enum ('waiter', 'kitchen', 'manager');
create type public.order_status as enum ('placed', 'confirmed', 'preparing', 'ready', 'served', 'cancelled');
create type public.request_type as enum ('waiter', 'bill');
create type public.request_status as enum ('open', 'acknowledged', 'resolved');

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  created_at timestamptz not null default now()
);

create table public.staff_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  role public.staff_role not null,
  full_name text not null check (char_length(full_name) between 1 and 120),
  created_at timestamptz not null default now()
);
create index staff_profiles_restaurant_idx on public.staff_profiles (restaurant_id);

create table public.tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 40),
  area text,
  seats int not null default 2 check (seats between 1 and 50),
  qr_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  unique (restaurant_id, label)
);

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index menu_categories_restaurant_idx on public.menu_categories (restaurant_id, sort_order);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  category_id uuid references public.menu_categories (id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  description text,
  price_cents int not null check (price_cents >= 0),
  image_url text,
  available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index menu_items_restaurant_idx on public.menu_items (restaurant_id, sort_order);

-- A guest's visit to one table. Guests are anonymous Supabase users.
create table public.table_sessions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  table_id uuid not null references public.tables (id) on delete cascade,
  guest_user_id uuid not null references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  closed_at timestamptz
);
create unique index table_sessions_one_open_per_guest_table
  on public.table_sessions (guest_user_id, table_id) where closed_at is null;
create index table_sessions_restaurant_idx on public.table_sessions (restaurant_id);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  table_id uuid not null references public.tables (id) on delete cascade,
  session_id uuid not null references public.table_sessions (id) on delete cascade,
  status public.order_status not null default 'placed',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  ready_at timestamptz,
  served_at timestamptz
);
create index orders_restaurant_status_idx on public.orders (restaurant_id, status);
create index orders_session_idx on public.orders (session_id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  name_snapshot text not null,
  price_cents_snapshot int not null check (price_cents_snapshot >= 0),
  quantity int not null check (quantity between 1 and 20),
  note text
);
create index order_items_order_idx on public.order_items (order_id);

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  table_id uuid not null references public.tables (id) on delete cascade,
  session_id uuid not null references public.table_sessions (id) on delete cascade,
  type public.request_type not null,
  status public.request_status not null default 'open',
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz
);
-- At most one unresolved request of each type per guest session (stops duplicate taps).
create unique index service_requests_one_open_per_type
  on public.service_requests (session_id, type) where status <> 'resolved';
create index service_requests_restaurant_status_idx on public.service_requests (restaurant_id, status);

-- Order lifecycle: stamp times and reject impossible status jumps.
create function public.orders_before_update() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.status is distinct from old.status then
    if not (
      (old.status = 'placed' and new.status in ('confirmed', 'cancelled')) or
      (old.status = 'confirmed' and new.status in ('preparing', 'cancelled')) or
      (old.status = 'preparing' and new.status = 'ready') or
      (old.status = 'ready' and new.status = 'served')
    ) then
      raise exception 'invalid order status change: % -> %', old.status, new.status
        using errcode = '23514';
    end if;
    if new.status = 'confirmed' then new.confirmed_at := now(); end if;
    if new.status = 'ready' then new.ready_at := now(); end if;
    if new.status = 'served' then new.served_at := now(); end if;
  end if;
  return new;
end;
$$;
create trigger orders_before_update before update on public.orders
  for each row execute function public.orders_before_update();

create function public.service_requests_before_update() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if not (
      (old.status = 'open' and new.status in ('acknowledged', 'resolved')) or
      (old.status = 'acknowledged' and new.status = 'resolved')
    ) then
      raise exception 'invalid request status change: % -> %', old.status, new.status
        using errcode = '23514';
    end if;
    if new.status = 'acknowledged' then
      new.acknowledged_at := now();
      new.acknowledged_by := auth.uid();
    end if;
    if new.status = 'resolved' then new.resolved_at := now(); end if;
  end if;
  return new;
end;
$$;
create trigger service_requests_before_update before update on public.service_requests
  for each row execute function public.service_requests_before_update();

-- Realtime: kitchen, waiter and guest screens subscribe to these (RLS still applies).
alter publication supabase_realtime add table public.orders, public.order_items, public.service_requests;
