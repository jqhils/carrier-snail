# Closed-app arrival push — Android setup

Make a snail's arrival push fire **when the app is fully closed**. All infra is
free (Supabase Edge Functions + cron + Expo Push). The code is built; these are
the one-time account/deploy steps. Project ref: `uftpbzknwnihmrfgnnyq`.

What's already in the repo:
- `push_token` column migration + `savePushToken` on the repo.
- App registers an Expo push token on launch and saves it (`registerRemoteArrivalPush.ts`), degrading to local notifications until the steps below are done.
- `runScheduledArrivalWorker` threads `userId` into each push.
- Edge Function `supabase/functions/arrival-push` (reuses the worker + a server-side Expo push sender).

## 1. Apply the push_token migration
Re-run the bundle (idempotent, now includes `202606200009_push_tokens.sql`):
`pbcopy < supabase/apply_all_migrations.sql` → Dashboard → SQL Editor → paste → Run.

## 2. Create the EAS project (gets a projectId)
```
npx eas login
npx eas init           # writes extra.eas.projectId into app.json
```
Commit the app.json change.

## 3. FCM credentials (Android delivery)
Expo Push routes Android through FCM. One-time, free:
1. Firebase console → new project → add Android app, package `com.jqhils.carriersnail`.
2. Project settings → Cloud Messaging → enable the **Firebase Cloud Messaging API (V1)**; create a **service account key** (JSON).
3. `npx eas credentials` → Android → push notifications → **FCM V1** → upload the service-account JSON.

## 4. Rebuild the dev-client + verify the token lands
The native config changed, so rebuild:
```
npx expo run:android
```
Launch the app, then in the Dashboard → Table Editor → `carrier_users`: your row's
**`push_token`** should now be an `ExponentPushToken[...]` value. If it's null, see
Troubleshooting.

## 5. Deploy the Edge Function
```
supabase login
supabase link --project-ref uftpbzknwnihmrfgnnyq
supabase functions deploy arrival-push
```
`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are auto-injected. Smoke test:
```
curl -X POST 'https://uftpbzknwnihmrfgnnyq.supabase.co/functions/v1/arrival-push' \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
# → {"completedCount":0,"evaluatedJourneyCount":N}
```
> If the deploy fails to bundle the `../../../src` imports, that's the one risk I
> couldn't verify locally — tell me the error and I'll adjust (add `.ts`
> extensions or vendor the worker into the function).

## 6. Schedule the cron (every minute)
Easiest: Dashboard → **Integrations → Cron** → new job → invoke the `arrival-push`
function, schedule `* * * * *`. (Snails are slow; per-minute is ample.)
Alternative (SQL): `pg_cron` + `pg_net` calling the function URL with the service key.

## 7. Test it (the Delivery Floor makes real arrivals take 24h+)
To test now without waiting out the Floor, make one journey *due*: in the
Table Editor, edit a `journeys` row so its deterministic ETA is in the past
(push `created_at` ~2 days back on an in-flight journey). Within a minute the cron
runs the worker → it marks the journey arrived and POSTs to Expo → **close the app
fully** and confirm the notification still arrives.

## Troubleshooting
- **`push_token` null:** no projectId (step 2), FCM not set up (step 3), notification
  permission denied, or you didn't rebuild (step 4). `getExpoPushTokenAsync` throws
  silently → registration returns null by design.
- **Function 401:** cron/curl must send `Authorization: Bearer <service_role_key>`.
- **No push but worker ran:** check the `journeys` row flipped to `arrived` and the
  user's `push_token` is set; check the Expo push receipt for the token.

## Cost note
Free on Supabase Nano. Caveat: free projects pause after ~7 days idle (cron stops) —
keep it active for demos, or Pro ($25/mo) for always-on. iOS would additionally need
the Apple Developer Program ($99/yr); Android is fully free.
