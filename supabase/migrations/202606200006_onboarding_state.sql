alter table public.carrier_users
  add column if not exists onboarding_completed_at timestamptz;
