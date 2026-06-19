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
