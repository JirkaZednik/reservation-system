create table public.courts (
  id smallint primary key check (id between 1 and 6),
  name text not null unique,
  is_active boolean not null default true
);

insert into public.courts (id, name)
values
  (1, 'Hřiště 1'),
  (2, 'Hřiště 2'),
  (3, 'Hřiště 3'),
  (4, 'Hřiště 4'),
  (5, 'Hřiště 5'),
  (6, 'Hřiště 6')
on conflict (id) do nothing;

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(trim(customer_name)) >= 4),
  customer_email text not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  cancellation_token_hash text unique,
  cancellation_expires_at timestamptz,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);

create table public.reservation_slots (
  reservation_date date not null,
  start_time time without time zone not null,
  court_id smallint not null references public.courts(id),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  primary key (reservation_date, start_time, court_id),
  check (start_time >= time '09:00' and start_time < time '22:00'),
  check (extract(minute from start_time) = 0 and extract(second from start_time) = 0)
);

create index reservation_slots_reservation_id_idx
  on public.reservation_slots (reservation_id);

alter table public.courts enable row level security;
alter table public.reservations enable row level security;
alter table public.reservation_slots enable row level security;

create function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

create policy "Admins can read courts"
  on public.courts for select to authenticated
  using (public.is_admin());

create policy "Admins can manage reservations"
  on public.reservations for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can manage reservation slots"
  on public.reservation_slots for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create function public.release_cancelled_reservation_slots()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'cancelled' and old.status is distinct from new.status then
    delete from public.reservation_slots where reservation_id = new.id;
  end if;

  return new;
end;
$$;

create trigger release_cancelled_reservation_slots
  after update of status on public.reservations
  for each row
  execute function public.release_cancelled_reservation_slots();

revoke all on public.courts, public.reservations, public.reservation_slots
  from anon, authenticated;
grant select on public.courts, public.reservations, public.reservation_slots
  to authenticated;
grant all on public.courts, public.reservations, public.reservation_slots
  to service_role;

create function public.get_occupied_slots(p_date date)
returns table (court_id smallint, start_time text)
language sql
stable
security definer
set search_path = ''
as $$
  select slots.court_id, to_char(slots.start_time, 'HH24:MI')
  from public.reservation_slots as slots
  join public.reservations as reservations on reservations.id = slots.reservation_id
  where slots.reservation_date = p_date
    and reservations.status = 'confirmed';
$$;

revoke all on function public.get_occupied_slots(date) from public;
grant execute on function public.get_occupied_slots(date) to anon, authenticated;

create function public.create_reservation(
  p_customer_name text,
  p_customer_email text,
  p_reservation_date date,
  p_court_id smallint,
  p_times text[],
  p_cancellation_token_hash text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_reservation_id uuid;
begin
  if char_length(trim(p_customer_name)) < 4 then
    raise exception 'Customer name must contain at least 4 characters.' using errcode = '22023';
  end if;

  if p_customer_email is null or position('@' in p_customer_email) < 2 then
    raise exception 'A valid customer email is required.' using errcode = '22023';
  end if;

  if p_cancellation_token_hash is null or length(p_cancellation_token_hash) < 32 then
    raise exception 'A valid cancellation token hash is required.' using errcode = '22023';
  end if;

  if p_reservation_date < current_date then
    raise exception 'Reservations cannot be made for a past date.' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.courts where id = p_court_id and is_active
  ) then
    raise exception 'The selected court is unavailable.' using errcode = '22023';
  end if;

  if coalesce(cardinality(p_times), 0) < 1 or cardinality(p_times) > 8 then
    raise exception 'Select between 1 and 8 hourly slots.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(p_times) as selected_time(value)
    where selected_time.value !~ '^(09|1[0-9]|2[01]):00$'
  ) then
    raise exception 'Selected times must be whole hours between 09:00 and 21:00.' using errcode = '22023';
  end if;

  if cardinality(p_times) <> (select count(distinct value) from unnest(p_times) as selected_time(value)) then
    raise exception 'A time slot cannot be selected more than once.' using errcode = '22023';
  end if;

  insert into public.reservations (
    customer_name,
    customer_email,
    cancellation_token_hash,
    cancellation_expires_at
  )
  values (
    trim(p_customer_name),
    lower(trim(p_customer_email)),
    p_cancellation_token_hash,
    now() + interval '30 days'
  )
  returning id into new_reservation_id;

  insert into public.reservation_slots (
    reservation_date,
    start_time,
    court_id,
    reservation_id
  )
  select
    p_reservation_date,
    selected_time.value::time,
    p_court_id,
    new_reservation_id
  from unnest(p_times) as selected_time(value);

  return new_reservation_id;
end;
$$;

revoke all on function public.create_reservation(text, text, date, smallint, text[], text) from public;
grant execute on function public.create_reservation(text, text, date, smallint, text[], text) to service_role;
