-- Carrier Snail — all migrations, in order. Idempotent: safe to run as one batch.
-- HOW TO APPLY: Supabase Dashboard > SQL Editor > New query > paste all > Run.

-- ============================================================
-- 202606200001_backend_spine.sql
-- ============================================================
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

-- ============================================================
-- 202606200002_recall_and_eggs.sql
-- ============================================================
alter type public.reminder_status add value if not exists 'recalled';
alter type public.journey_status add value if not exists 'recalled';

alter table public.reminders
  add column if not exists recalled_at timestamptz;

alter table public.journeys
  add column if not exists recalled_at timestamptz;

create table if not exists public.eggs (
  user_id uuid not null references public.carrier_users(id) on delete cascade,
  id text not null,
  source text not null default 'earned' check (source in ('earned')),
  status text not null default 'unhatched' check (status in ('unhatched')),
  earned_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists eggs_user_status_idx on public.eggs(user_id, status);

drop trigger if exists set_eggs_updated_at on public.eggs;
create trigger set_eggs_updated_at
before update on public.eggs
for each row execute function public.set_updated_at();

alter table public.eggs enable row level security;

drop policy if exists eggs_owner_all on public.eggs;
create policy eggs_owner_all
on public.eggs
for all
to authenticated
using (
  exists (
    select 1 from public.carrier_users
    where carrier_users.id = eggs.user_id
      and carrier_users.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.carrier_users
    where carrier_users.id = eggs.user_id
      and carrier_users.auth_user_id = auth.uid()
  )
);

-- ============================================================
-- 202606200003_snail_traits.sql
-- ============================================================
alter table public.snails
  add column if not exists speed_band text not null default 'garden'
    check (speed_band in ('garden', 'steady', 'swift', 'mythic')),
  add column if not exists reliability numeric not null default 0.95
    check (reliability >= 0 and reliability <= 1),
  add column if not exists quirk text not null default 'none'
    check (quirk in ('none', 'cursed-backwards', 'napper', 'scenic-detour')),
  add column if not exists appearance jsonb not null default
    '{"bodyColor":"#d99f5f","shellColor":"#7b4b34"}'::jsonb,
  add column if not exists trail_traits jsonb not null default
    '{"color":"#f5f8ed","persistenceMs":259200000,"texture":"glistening"}'::jsonb;

-- ============================================================
-- 202606200004_hatching_leveling.sql
-- ============================================================
alter table public.carrier_users
  add column if not exists soft_currency_slime integer not null default 0
    check (soft_currency_slime >= 0);

alter table public.snails
  add column if not exists experience_points integer not null default 0
    check (experience_points >= 0),
  add column if not exists journeys_completed integer not null default 0
    check (journeys_completed >= 0);

alter table public.eggs
  add column if not exists rarity_pool text not null default 'earned-basic',
  add column if not exists hatched_at timestamptz,
  add column if not exists hatched_snail_id text;

alter table public.eggs
  drop constraint if exists eggs_status_check,
  drop constraint if exists eggs_rarity_pool_check,
  add constraint eggs_status_check check (status in ('unhatched', 'hatched')),
  add constraint eggs_rarity_pool_check check (rarity_pool in ('earned-basic'));

-- ============================================================
-- 202606200005_revenuecat_inventory.sql
-- ============================================================
alter table public.carrier_users
  add column if not exists inventory jsonb not null default '{"cosmetics":[]}'::jsonb,
  add column if not exists purchase_records jsonb not null default '[]'::jsonb,
  add column if not exists purchased_stable_slots integer not null default 0
    check (purchased_stable_slots >= 0);

alter table public.eggs
  drop constraint if exists eggs_source_check,
  drop constraint if exists eggs_rarity_pool_check,
  add constraint eggs_source_check check (source in ('earned', 'purchased')),
  add constraint eggs_rarity_pool_check check (
    rarity_pool in ('earned-basic', 'paid-premium')
  );

-- ============================================================
-- 202606200006_onboarding_state.sql
-- ============================================================
alter table public.carrier_users
  add column if not exists onboarding_completed_at timestamptz;

-- ============================================================
-- 202606200007_todos.sql
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'todo_status') then
    create type public.todo_status as enum ('open', 'done');
  end if;
end
$$;

create table if not exists public.todos (
  user_id uuid not null references public.carrier_users(id) on delete cascade,
  id text not null,
  text text not null check (length(trim(text)) > 0),
  status public.todo_status not null default 'open',
  created_at timestamptz not null default now(),
  done_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

insert into public.todos (user_id, id, text, status, created_at, done_at)
select
  user_id,
  id,
  text,
  case when status = 'delivered' then 'open'::public.todo_status else 'open'::public.todo_status end,
  created_at,
  null
from public.reminders
on conflict (user_id, id) do nothing;

alter table public.journeys
  add column if not exists todo_id text;

update public.journeys
set todo_id = reminder_id
where todo_id is null;

alter table public.journeys
  alter column reminder_id drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'journeys_user_todo_fk'
  ) then
    alter table public.journeys
      add constraint journeys_user_todo_fk
      foreign key (user_id, todo_id)
      references public.todos(user_id, id)
      on update cascade;
  end if;
end
$$;

create index if not exists todos_user_status_idx on public.todos(user_id, status);
create index if not exists journeys_user_todo_idx on public.journeys(user_id, todo_id);

drop trigger if exists set_todos_updated_at on public.todos;
create trigger set_todos_updated_at
before update on public.todos
for each row execute function public.set_updated_at();

alter table public.todos enable row level security;

drop policy if exists todos_owner_all on public.todos;
create policy todos_owner_all
on public.todos
for all
to authenticated
using (
  exists (
    select 1 from public.carrier_users
    where carrier_users.id = todos.user_id
      and carrier_users.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.carrier_users
    where carrier_users.id = todos.user_id
      and carrier_users.auth_user_id = auth.uid()
  )
);

-- ============================================================
-- 202606200008_arrival_notifications.sql
-- ============================================================
create table if not exists public.arrival_notifications (
  user_id uuid not null references public.carrier_users(id) on delete cascade,
  id text not null,
  journey_id text not null,
  todo_id text,
  reminder_id text,
  snail_id text not null,
  snail_name text not null,
  text text not null check (length(trim(text)) > 0),
  arrived_at timestamptz not null,
  seen_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists arrival_notifications_user_seen_idx
on public.arrival_notifications(user_id, seen_at);

create index if not exists arrival_notifications_user_arrived_idx
on public.arrival_notifications(user_id, arrived_at desc);

drop trigger if exists set_arrival_notifications_updated_at
on public.arrival_notifications;
create trigger set_arrival_notifications_updated_at
before update on public.arrival_notifications
for each row execute function public.set_updated_at();

alter table public.arrival_notifications enable row level security;

drop policy if exists arrival_notifications_owner_all
on public.arrival_notifications;
create policy arrival_notifications_owner_all
on public.arrival_notifications
for all
to authenticated
using (
  exists (
    select 1 from public.carrier_users
    where carrier_users.id = arrival_notifications.user_id
      and carrier_users.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.carrier_users
    where carrier_users.id = arrival_notifications.user_id
      and carrier_users.auth_user_id = auth.uid()
  )
);

-- ============================================================
-- 202606200009_push_tokens.sql
-- ============================================================
-- Store the device's Expo push token so the server can deliver arrival pushes
-- when the app is fully closed. One token per anonymous carrier user (v1).
-- RLS already lets a user update their own carrier_users row; the arrival worker
-- reads tokens with the service role, bypassing RLS.
alter table public.carrier_users
  add column if not exists push_token text;

