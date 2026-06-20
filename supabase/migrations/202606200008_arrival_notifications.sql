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
