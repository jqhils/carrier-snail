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
