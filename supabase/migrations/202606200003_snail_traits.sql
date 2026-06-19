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
