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
