create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'snail_status') then
    create type public.snail_status as enum ('resting', 'on-journey');
  end if;

  if not exists (select 1 from pg_type where typname = 'reminder_status') then
    create type public.reminder_status as enum ('in-flight', 'delivered');
  end if;

  if not exists (select 1 from pg_type where typname = 'journey_status') then
    create type public.journey_status as enum ('in-flight', 'arrived');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.carrier_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  is_anonymous boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.snails (
  user_id uuid not null references public.carrier_users(id) on delete cascade,
  id text not null,
  name text not null,
  rarity text not null default 'common',
  level integer not null default 1 check (level >= 1),
  base_speed_meters_per_hour numeric not null default 48 check (base_speed_meters_per_hour > 0),
  quirk_seed text not null default '',
  temperament text not null default 'steady',
  cosmetics jsonb not null default '{}'::jsonb,
  status public.snail_status not null default 'resting',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.reminders (
  user_id uuid not null references public.carrier_users(id) on delete cascade,
  id text not null,
  snail_id text not null,
  text text not null check (length(trim(text)) > 0),
  status public.reminder_status not null default 'in-flight',
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, snail_id) references public.snails(user_id, id) on update cascade
);

create table if not exists public.journeys (
  user_id uuid not null references public.carrier_users(id) on delete cascade,
  id text not null,
  reminder_id text not null,
  snail_id text not null,
  start_latitude double precision not null check (start_latitude between -90 and 90),
  start_longitude double precision not null check (start_longitude between -180 and 180),
  target_latitude double precision not null check (target_latitude between -90 and 90),
  target_longitude double precision not null check (target_longitude between -180 and 180),
  base_speed_meters_per_hour numeric not null default 48 check (base_speed_meters_per_hour > 0),
  quirk_seed text not null default '',
  trail_history jsonb not null default '[]'::jsonb,
  status public.journey_status not null default 'in-flight',
  created_at timestamptz not null default now(),
  arrived_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, reminder_id) references public.reminders(user_id, id) on update cascade,
  foreign key (user_id, snail_id) references public.snails(user_id, id) on update cascade
);

create index if not exists snails_user_status_idx on public.snails(user_id, status);
create index if not exists reminders_user_status_idx on public.reminders(user_id, status);
create index if not exists journeys_user_status_idx on public.journeys(user_id, status);
create index if not exists journeys_user_reminder_idx on public.journeys(user_id, reminder_id);

drop trigger if exists set_carrier_users_updated_at on public.carrier_users;
create trigger set_carrier_users_updated_at
before update on public.carrier_users
for each row execute function public.set_updated_at();

drop trigger if exists set_snails_updated_at on public.snails;
create trigger set_snails_updated_at
before update on public.snails
for each row execute function public.set_updated_at();

drop trigger if exists set_reminders_updated_at on public.reminders;
create trigger set_reminders_updated_at
before update on public.reminders
for each row execute function public.set_updated_at();

drop trigger if exists set_journeys_updated_at on public.journeys;
create trigger set_journeys_updated_at
before update on public.journeys
for each row execute function public.set_updated_at();

alter table public.carrier_users enable row level security;
alter table public.snails enable row level security;
alter table public.reminders enable row level security;
alter table public.journeys enable row level security;

drop policy if exists carrier_users_owner_all on public.carrier_users;
create policy carrier_users_owner_all
on public.carrier_users
for all
to authenticated
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

drop policy if exists snails_owner_all on public.snails;
create policy snails_owner_all
on public.snails
for all
to authenticated
using (
  exists (
    select 1 from public.carrier_users
    where carrier_users.id = snails.user_id
      and carrier_users.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.carrier_users
    where carrier_users.id = snails.user_id
      and carrier_users.auth_user_id = auth.uid()
  )
);

drop policy if exists reminders_owner_all on public.reminders;
create policy reminders_owner_all
on public.reminders
for all
to authenticated
using (
  exists (
    select 1 from public.carrier_users
    where carrier_users.id = reminders.user_id
      and carrier_users.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.carrier_users
    where carrier_users.id = reminders.user_id
      and carrier_users.auth_user_id = auth.uid()
  )
);

drop policy if exists journeys_owner_all on public.journeys;
create policy journeys_owner_all
on public.journeys
for all
to authenticated
using (
  exists (
    select 1 from public.carrier_users
    where carrier_users.id = journeys.user_id
      and carrier_users.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.carrier_users
    where carrier_users.id = journeys.user_id
      and carrier_users.auth_user_id = auth.uid()
  )
);
