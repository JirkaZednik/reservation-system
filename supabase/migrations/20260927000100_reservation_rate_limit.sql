/*
  This migration creates a table to store rate limit information for reservations.
  Store hashed identifiers and limit each one to five requests per 15-minute window.
*/

create table public.reservation_rate_limits (
  identifier_hash text primary key check (identifier_hash ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0)
);

alter table public.reservation_rate_limits enable row level security;
revoke all on public.reservation_rate_limits from public, anon, authenticated;
grant all on public.reservation_rate_limits to service_role;

create function public.consume_reservation_rate_limit(p_identifier_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_request_count integer;
begin
  if p_identifier_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid rate limit identifier.' using errcode = '22023';
  end if;

  delete from public.reservation_rate_limits
  where window_started_at < now() - interval '24 hours';

  insert into public.reservation_rate_limits (
    identifier_hash,
    window_started_at,
    request_count
  )
  values (p_identifier_hash, now(), 1)
  on conflict (identifier_hash) do update
    set window_started_at = case
          when public.reservation_rate_limits.window_started_at <= now() - interval '15 minutes' then now()
          else public.reservation_rate_limits.window_started_at
        end,
        request_count = case
          when public.reservation_rate_limits.window_started_at <= now() - interval '15 minutes' then 1
          else public.reservation_rate_limits.request_count + 1
        end
  returning request_count into current_request_count;

  return current_request_count <= 5;
end;
$$;

revoke all on function public.consume_reservation_rate_limit(text) from public, anon, authenticated;
grant execute on function public.consume_reservation_rate_limit(text) to service_role;
