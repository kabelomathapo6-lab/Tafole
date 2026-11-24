begin;
select plan(29);

-- Fixtures (run as the superuser, so RLS is bypassed) -------------------------
insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'manager-a@test'),
  ('a0000000-0000-0000-0000-000000000002', 'waiter-a@test'),
  ('a0000000-0000-0000-0000-000000000003', 'kitchen-a@test'),
  ('b0000000-0000-0000-0000-000000000001', 'manager-b@test');
insert into auth.users (id, is_anonymous) values
  ('c0000000-0000-0000-0000-000000000001', true),
  ('c0000000-0000-0000-0000-000000000002', true);

insert into public.restaurants (id, name, slug) values
  ('11111111-1111-1111-1111-111111111111', 'Restaurant A', 'rest-a'),
  ('22222222-2222-2222-2222-222222222222', 'Restaurant B', 'rest-b');

insert into public.staff_profiles (user_id, restaurant_id, role, full_name) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'manager', 'Manager A'),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'waiter',  'Waiter A'),
  ('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'kitchen', 'Kitchen A'),
  ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'manager', 'Manager B');

insert into public.tables (id, restaurant_id, label, qr_token) values
  ('d1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Table 1', 'e1000000-0000-0000-0000-000000000001'),
  ('d2000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Table 1', 'e2000000-0000-0000-0000-000000000001');

insert into public.menu_items (id, restaurant_id, name, price_cents, available) values
  ('f1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Burger', 12500, true),
  ('f1000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Sold-out special', 9900, false),
  ('f2000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Pizza B', 9000, true);

create function pg_temp.login_as(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  set local role authenticated;
end $$;
create function pg_temp.logout() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claim.sub', '', true);
end $$;

-- Anonymous role has no access ------------------------------------------------
set local role anon;
select throws_ok($$select * from public.menu_items$$, '42501', null, 'anon cannot read menu_items');
select throws_ok($$select public.start_table_session('e1000000-0000-0000-0000-000000000001')$$, '42501', null, 'anon cannot start a session');
reset role;

-- Staff isolation --------------------------------------------------------------
select pg_temp.login_as('a0000000-0000-0000-0000-000000000002');  -- waiter A
select is((select count(*)::int from public.menu_items), 2, 'waiter A sees only restaurant A menu items');
select is((select count(*)::int from public.tables), 1, 'waiter A sees only restaurant A tables');
select is((select count(*)::int from public.restaurants), 1, 'waiter A sees only their restaurant');
select throws_ok(
  $$insert into public.menu_items (restaurant_id, name, price_cents) values ('11111111-1111-1111-1111-111111111111', 'Hack', 1)$$,
  '42501', null, 'waiter cannot create menu items');
select pg_temp.logout();

select pg_temp.login_as('b0000000-0000-0000-0000-000000000001');  -- manager B
select is((select count(*)::int from public.menu_items), 1, 'manager B sees only restaurant B menu');
select throws_ok(
  $$insert into public.menu_items (restaurant_id, name, price_cents) values ('11111111-1111-1111-1111-111111111111', 'Cross-tenant', 1)$$,
  '42501', null, 'manager B cannot write to restaurant A');
select pg_temp.logout();

select pg_temp.login_as('a0000000-0000-0000-0000-000000000001');  -- manager A
select lives_ok(
  $$insert into public.menu_items (restaurant_id, name, price_cents) values ('11111111-1111-1111-1111-111111111111', 'New dish', 5000)$$,
  'manager A can create menu items in their own restaurant');
select pg_temp.logout();

-- Guest flow ---------------------------------------------------------------------
select pg_temp.login_as('c0000000-0000-0000-0000-000000000001');  -- guest 1
select is((select count(*)::int from public.menu_items), 0, 'guest sees no menu before scanning a QR code');
select is(
  (select table_id from public.start_table_session('e1000000-0000-0000-0000-000000000001')),
  'd1000000-0000-0000-0000-000000000001'::uuid, 'scanning a QR code starts a session for that table');
select is((select count(*)::int from public.menu_items), 3, 'guest then sees only that restaurant menu');
select is((select count(*)::int from public.tables), 1, 'guest sees only their own table');
select throws_ok(
  $$insert into public.orders (restaurant_id, table_id, session_id) select restaurant_id, table_id, id from public.table_sessions$$,
  '42501', null, 'guest cannot insert orders directly');

create temp table t_session as select id from public.table_sessions limit 1;
grant select on t_session to authenticated;
select public.place_order((select id from t_session),
  '[{"menu_item_id":"f1000000-0000-0000-0000-000000000001","quantity":2,"note":"no onions"}]'::jsonb, 'allergy: nuts');

select is((select price_cents_snapshot from public.order_items limit 1), 12500, 'order stores the server-side price, not a client price');
select throws_ok(
  format($$select public.place_order(%L, '[{"menu_item_id":"f1000000-0000-0000-0000-000000000002","quantity":1}]'::jsonb)$$, (select id from t_session)),
  'P0002', 'item not available', 'cannot order an unavailable item');

select is((public.create_service_request((select id from t_session), 'waiter')).status::text, 'open', 'guest can call the waiter');
select is((select count(*)::int from public.service_requests where type = 'waiter'), 1, 'no duplicate after one call');
select public.create_service_request((select id from t_session), 'waiter');
select is((select count(*)::int from public.service_requests where type = 'waiter'), 1, 'calling the waiter twice does not create a duplicate');
select pg_temp.logout();

-- Another guest cannot see or use guest 1's data ----------------------------------
select pg_temp.login_as('c0000000-0000-0000-0000-000000000002');
select is((select count(*)::int from public.orders), 0, 'guest 2 cannot see guest 1 orders');
select throws_ok(
  format($$select public.place_order(%L, '[{"menu_item_id":"f1000000-0000-0000-0000-000000000001","quantity":1}]'::jsonb)$$, (select id from t_session)),
  '42501', 'invalid session', 'guest 2 cannot order into guest 1 session');
select pg_temp.logout();

-- Kitchen and waiter order handling ---------------------------------------------------
select pg_temp.login_as('a0000000-0000-0000-0000-000000000003');  -- kitchen
select is((select count(*)::int from public.orders), 1, 'kitchen sees restaurant orders');
update public.orders set status = 'preparing';
select is((select status::text from public.orders), 'placed', 'kitchen cannot touch an order the waiter has not confirmed');
select pg_temp.logout();


select pg_temp.login_as('a0000000-0000-0000-0000-000000000002');  -- waiter
select throws_ok($$update public.orders set status = 'ready'$$, '23514', null, 'order cannot skip from placed to ready');
select lives_ok($$update public.order_items set quantity = 3$$, 'waiter can edit items while the order is still placed');
select lives_ok($$update public.orders set status = 'confirmed'$$, 'waiter can confirm an order');
update public.order_items set quantity = 9;
select is((select quantity from public.order_items limit 1), 3, 'waiter cannot edit items after the order is confirmed');
select pg_temp.logout();

select pg_temp.login_as('a0000000-0000-0000-0000-000000000003');  -- kitchen
select lives_ok($$update public.orders set status = 'preparing'$$, 'kitchen can start preparing a confirmed order');
select throws_ok($$update public.orders set status = 'served'$$, null, null, 'kitchen cannot mark an order served');
select pg_temp.logout();


select * from finish();
rollback;
