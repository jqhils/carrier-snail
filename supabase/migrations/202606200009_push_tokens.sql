-- Store the device's Expo push token so the server can deliver arrival pushes
-- when the app is fully closed. One token per anonymous carrier user (v1).
-- RLS already lets a user update their own carrier_users row; the arrival worker
-- reads tokens with the service role, bypassing RLS.
alter table public.carrier_users
  add column if not exists push_token text;
