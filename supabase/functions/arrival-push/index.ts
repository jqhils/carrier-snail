// Carrier Snail — scheduled arrival worker (Supabase Edge Function, Deno).
//
// Runs on a cron. Reuses the unit-tested runScheduledArrivalWorker + the
// SupabaseCarrierRepository from src/ (single source of truth — no logic
// duplicated here), with a server-side PushSender that looks up each user's
// stored Expo push token and delivers via the (free) Expo Push API. This is
// what makes an arrival push fire when the app is fully closed.
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically by the
// Edge runtime; the service role bypasses RLS so the worker can read every
// user's pending journeys + push token.
import { createClient } from "npm:@supabase/supabase-js@2";

import { SupabaseCarrierRepository } from "../../../src/backend/supabaseCarrierRepository.ts";
import type { ArrivalPush, PushSender } from "../../../src/useCases/pushSender.ts";
import { runScheduledArrivalWorker } from "../../../src/useCases/runScheduledArrivalWorker.ts";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response("Missing Supabase env", { status: 500 });
  }

  const client = createClient(supabaseUrl, serviceRoleKey);
  const repository = new SupabaseCarrierRepository(client);

  const pushSender: PushSender = {
    cancelArrival() {
      // Scheduled pushes are sent at arrival time, not pre-scheduled; nothing to cancel.
    },
    async sendArrival(push: ArrivalPush) {
      if (!push.userId) {
        return;
      }

      const { data } = await client
        .from("carrier_users")
        .select("push_token")
        .eq("id", push.userId)
        .maybeSingle();

      const token = data?.push_token as string | null | undefined;
      if (!token) {
        return;
      }

      await fetch(EXPO_PUSH_URL, {
        body: JSON.stringify({
          body: push.text,
          channelId: "arrivals",
          data: { reminderId: push.reminderId },
          title: push.title,
          to: token
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
    }
  };

  const result = await runScheduledArrivalWorker({
    clock: { now: () => Date.now() },
    pushSender,
    repository
  });

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  });
});
