alter table public.snails
  add column if not exists released_at timestamptz;

create index if not exists snails_user_released_idx
  on public.snails(user_id, released_at);
