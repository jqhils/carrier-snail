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
