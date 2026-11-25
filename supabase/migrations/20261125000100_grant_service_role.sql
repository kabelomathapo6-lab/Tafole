-- Tables created by `supabase db push` are owned by the CLI's temporary login role, so the
-- default privileges that normally give service_role access to new tables do not apply.
-- Grant explicitly so server-side tools (such as the seed script) can use the secret key.
-- RLS still applies to anon and authenticated; service_role bypasses it by design.

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
