-- Row Level Security and guest RPCs.
-- Rules: staff see only their own restaurant; guests see only their own open table session;
-- guests never write to tables directly (orders and requests go through the RPCs below,
-- which re-check everything server-side, including prices).

create schema if not exists private;
grant usage on schema private to authenticated;

create function private.staff_restaurant_id() returns uuid
language sql stable security definer set search_path = ''
as $$ select restaurant_id from public.staff_profiles where user_id = (select auth.uid()) $$;

create function private.staff_role() returns public.staff_role
language sql stable security definer set search_path = ''
as $$ select role from public.staff_profiles where user_id = (select auth.uid()) $$;

create function private.guest_session_ids() returns setof uuid
language sql stable security definer set search_path = ''
as $$ select id from public.table_sessions
      where guest_user_id = (select auth.uid()) and closed_at is null $$;

create function private.guest_restaurant_ids() returns setof uuid
language sql stable security definer set search_path = ''
as $$ select restaurant_id from public.table_sessions
      where guest_user_id = (select auth.uid()) and closed_at is null $$;

create function private.guest_table_ids() returns setof uuid
language sql stable security definer set search_path = ''
as $$ select table_id from public.table_sessions
      where guest_user_id = (select auth.uid()) and closed_at is null $$;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

-- Tables are closed by default; grant only what policies can then narrow.
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

alter table public.restaurants enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.tables enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.table_sessions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.service_requests enable row level security;

-- restaurants
create policy restaurants_read on public.restaurants for select to authenticated
  using (id = (select private.staff_restaurant_id())
         or id in (select private.guest_restaurant_ids()));
create policy restaurants_manager_update on public.restaurants for update to authenticated
  using (id = (select private.staff_restaurant_id()) and (select private.staff_role()) = 'manager')
  with check (id = (select private.staff_restaurant_id()) and (select private.staff_role()) = 'manager');

-- staff_profiles (rows are created server-side by the invite flow using the service role)
create policy staff_read on public.staff_profiles for select to authenticated
  using (user_id = (select auth.uid())
         or (restaurant_id = (select private.staff_restaurant_id())
             and (select private.staff_role()) = 'manager'));
create policy staff_manager_update on public.staff_profiles for update to authenticated
  using (restaurant_id = (select private.staff_restaurant_id()) and (select private.staff_role()) = 'manager')
  with check (restaurant_id = (select private.staff_restaurant_id()) and (select private.staff_role()) = 'manager');
create policy staff_manager_delete on public.staff_profiles for delete to authenticated
  using (restaurant_id = (select private.staff_restaurant_id())
         and (select private.staff_role()) = 'manager'
         and user_id <> (select auth.uid()));

-- tables
create policy tables_read on public.tables for select to authenticated
  using (restaurant_id = (select private.staff_restaurant_id())
         or id in (select private.guest_table_ids()));
create policy tables_manager_write on public.tables for all to authenticated
  using (restaurant_id = (select private.staff_restaurant_id()) and (select private.staff_role()) = 'manager')
  with check (restaurant_id = (select private.staff_restaurant_id()) and (select private.staff_role()) = 'manager');

-- menu
create policy menu_categories_read on public.menu_categories for select to authenticated
  using (restaurant_id = (select private.staff_restaurant_id())
         or restaurant_id in (select private.guest_restaurant_ids()));
create policy menu_categories_manager_write on public.menu_categories for all to authenticated
  using (restaurant_id = (select private.staff_restaurant_id()) and (select private.staff_role()) = 'manager')
  with check (restaurant_id = (select private.staff_restaurant_id()) and (select private.staff_role()) = 'manager');

create policy menu_items_read on public.menu_items for select to authenticated
  using (restaurant_id = (select private.staff_restaurant_id())
         or restaurant_id in (select private.guest_restaurant_ids()));
create policy menu_items_manager_write on public.menu_items for all to authenticated
  using (restaurant_id = (select private.staff_restaurant_id()) and (select private.staff_role()) = 'manager')
  with check (restaurant_id = (select private.staff_restaurant_id()) and (select private.staff_role()) = 'manager');

-- table_sessions (created only through start_table_session)
create policy sessions_read on public.table_sessions for select to authenticated
  using (guest_user_id = (select auth.uid())
         or restaurant_id = (select private.staff_restaurant_id()));
create policy sessions_staff_update on public.table_sessions for update to authenticated
  using (restaurant_id = (select private.staff_restaurant_id())
         and (select private.staff_role()) in ('waiter', 'manager'))
  with check (restaurant_id = (select private.staff_restaurant_id())
         and (select private.staff_role()) in ('waiter', 'manager'));

-- orders (created only through place_order)
create policy orders_read on public.orders for select to authenticated
  using (restaurant_id = (select private.staff_restaurant_id())
         or session_id in (select private.guest_session_ids()));
create policy orders_waiter_update on public.orders for update to authenticated
  using (restaurant_id = (select private.staff_restaurant_id())
         and (select private.staff_role()) in ('waiter', 'manager'))
  with check (restaurant_id = (select private.staff_restaurant_id())
         and (select private.staff_role()) in ('waiter', 'manager'));
create policy orders_kitchen_update on public.orders for update to authenticated
  using (restaurant_id = (select private.staff_restaurant_id())
         and (select private.staff_role()) = 'kitchen'
         and status in ('confirmed', 'preparing'))
  with check (restaurant_id = (select private.staff_restaurant_id())
         and status in ('preparing', 'ready'));

-- order_items: waiters/managers may edit only while the order is still 'placed'
create policy order_items_read on public.order_items for select to authenticated
  using (restaurant_id = (select private.staff_restaurant_id())
         or order_id in (select id from public.orders where session_id in (select private.guest_session_ids())));
create policy order_items_waiter_write on public.order_items for all to authenticated
  using (restaurant_id = (select private.staff_restaurant_id())
         and (select private.staff_role()) in ('waiter', 'manager')
         and exists (select 1 from public.orders o where o.id = order_id and o.status = 'placed'))
  with check (restaurant_id = (select private.staff_restaurant_id())
         and (select private.staff_role()) in ('waiter', 'manager')
         and exists (select 1 from public.orders o
                     where o.id = order_id and o.restaurant_id = order_items.restaurant_id and o.status = 'placed'));

-- service_requests (created only through create_service_request)
create policy requests_read on public.service_requests for select to authenticated
  using (restaurant_id = (select private.staff_restaurant_id())
         or session_id in (select private.guest_session_ids()));
create policy requests_staff_update on public.service_requests for update to authenticated
  using (restaurant_id = (select private.staff_restaurant_id())
         and (select private.staff_role()) in ('waiter', 'manager'))
  with check (restaurant_id = (select private.staff_restaurant_id())
         and (select private.staff_role()) in ('waiter', 'manager'));

-- Guest RPCs ---------------------------------------------------------------

create function public.start_table_session(p_qr_token uuid)
returns public.table_sessions
language plpgsql security definer set search_path = ''
as $$
declare
  v_table public.tables;
  v_session public.table_sessions;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  select * into v_table from public.tables where qr_token = p_qr_token;
  if not found then
    raise exception 'unknown table' using errcode = 'P0002';
  end if;
  insert into public.table_sessions (restaurant_id, table_id, guest_user_id)
  values (v_table.restaurant_id, v_table.id, auth.uid())
  on conflict (guest_user_id, table_id) where closed_at is null do nothing;
  select * into v_session from public.table_sessions
   where guest_user_id = auth.uid() and table_id = v_table.id and closed_at is null;
  return v_session;
end;
$$;

-- p_items: [{"menu_item_id": "<uuid>", "quantity": 2, "note": "no onions"}]
create function public.place_order(p_session_id uuid, p_items jsonb, p_notes text default null)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_session public.table_sessions;
  v_order_id uuid;
  v_item jsonb;
  v_menu public.menu_items;
  v_qty int;
begin
  select * into v_session from public.table_sessions
   where id = p_session_id and guest_user_id = auth.uid() and closed_at is null;
  if not found then
    raise exception 'invalid session' using errcode = '42501';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'an order needs at least one item' using errcode = '22023';
  end if;

  insert into public.orders (restaurant_id, table_id, session_id, notes)
  values (v_session.restaurant_id, v_session.table_id, v_session.id, left(p_notes, 500))
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 20 then
      raise exception 'invalid quantity' using errcode = '22023';
    end if;
    select * into v_menu from public.menu_items
     where id = (v_item ->> 'menu_item_id')::uuid
       and restaurant_id = v_session.restaurant_id
       and available;
    if not found then
      raise exception 'item not available' using errcode = 'P0002';
    end if;
    insert into public.order_items
      (order_id, restaurant_id, menu_item_id, name_snapshot, price_cents_snapshot, quantity, note)
    values
      (v_order_id, v_session.restaurant_id, v_menu.id, v_menu.name, v_menu.price_cents, v_qty,
       left(v_item ->> 'note', 200));
  end loop;
  return v_order_id;
end;
$$;

-- Returns the existing unresolved request if the guest already made one of this type.
create function public.create_service_request(p_session_id uuid, p_type public.request_type)
returns public.service_requests
language plpgsql security definer set search_path = ''
as $$
declare
  v_session public.table_sessions;
  v_request public.service_requests;
begin
  select * into v_session from public.table_sessions
   where id = p_session_id and guest_user_id = auth.uid() and closed_at is null;
  if not found then
    raise exception 'invalid session' using errcode = '42501';
  end if;
  insert into public.service_requests (restaurant_id, table_id, session_id, type)
  values (v_session.restaurant_id, v_session.table_id, v_session.id, p_type)
  on conflict (session_id, type) where status <> 'resolved' do nothing;
  select * into v_request from public.service_requests
   where session_id = v_session.id and type = p_type and status <> 'resolved';
  return v_request;
end;
$$;

revoke execute on function public.start_table_session(uuid) from public, anon;
revoke execute on function public.place_order(uuid, jsonb, text) from public, anon;
revoke execute on function public.create_service_request(uuid, public.request_type) from public, anon;
grant execute on function public.start_table_session(uuid) to authenticated;
grant execute on function public.place_order(uuid, jsonb, text) to authenticated;
grant execute on function public.create_service_request(uuid, public.request_type) to authenticated;
