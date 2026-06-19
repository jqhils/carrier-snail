import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import {
  cloneCarrierState,
  type CarrierState,
  type JourneyRecord,
  type Reminder,
  type Snail
} from "../useCases/localCarrierState";
import type {
  AuthenticatedUser,
  BackendCarrierRepository,
  CarrierUser
} from "../useCases/resolveAnonymousCarrierUser";

type CarrierUserRow = {
  auth_user_id: string;
  created_at: string;
  id: string;
};

type SnailRow = {
  id: string;
  name: string;
  status: Snail["status"];
};

type ReminderRow = {
  created_at: string;
  delivered_at: string | null;
  id: string;
  snail_id: string;
  status: Reminder["status"];
  text: string;
};

type JourneyRow = {
  arrived_at: string | null;
  base_speed_meters_per_hour: number;
  created_at: string;
  id: string;
  reminder_id: string;
  snail_id: string;
  start_latitude: number;
  start_longitude: number;
  status: JourneyRecord["status"];
  target_latitude: number;
  target_longitude: number;
};

export class SupabaseCarrierRepository implements BackendCarrierRepository {
  constructor(private readonly client: SupabaseClient) {}

  async ensureUser(
    authUser: AuthenticatedUser,
    nowMs: number
  ): Promise<CarrierUser> {
    const existing = await this.client
      .from("carrier_users")
      .select("id, auth_user_id, created_at")
      .eq("auth_user_id", authUser.authUserId)
      .maybeSingle();

    assertNoSupabaseError(existing.error, "load Carrier user");

    if (existing.data) {
      return mapCarrierUser(existing.data as CarrierUserRow);
    }

    const inserted = await this.client
      .from("carrier_users")
      .insert({
        auth_user_id: authUser.authUserId,
        created_at: toIso(nowMs),
        is_anonymous: authUser.isAnonymous,
        updated_at: toIso(nowMs)
      })
      .select("id, auth_user_id, created_at")
      .single();

    assertNoSupabaseError(inserted.error, "create Carrier user");

    return mapCarrierUser(inserted.data as CarrierUserRow);
  }

  async loadCarrierState(userId: string): Promise<CarrierState> {
    const [snails, reminders, journeys] = await Promise.all([
      this.client
        .from("snails")
        .select("id, name, status")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      this.client
        .from("reminders")
        .select("id, snail_id, text, status, created_at, delivered_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      this.client
        .from("journeys")
        .select(
          [
            "id",
            "reminder_id",
            "snail_id",
            "status",
            "created_at",
            "arrived_at",
            "start_latitude",
            "start_longitude",
            "target_latitude",
            "target_longitude",
            "base_speed_meters_per_hour"
          ].join(", ")
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
    ]);

    assertNoSupabaseError(snails.error, "load snails");
    assertNoSupabaseError(reminders.error, "load reminders");
    assertNoSupabaseError(journeys.error, "load journeys");

    return {
      journeys: asRows<JourneyRow>(journeys.data).map(mapJourney),
      reminders: asRows<ReminderRow>(reminders.data).map(mapReminder),
      snails: asRows<SnailRow>(snails.data).map(mapSnail)
    };
  }

  async saveCarrierState(userId: string, state: CarrierState): Promise<void> {
    const snapshot = cloneCarrierState(state);

    if (snapshot.snails.length > 0) {
      const result = await this.client.from("snails").upsert(
        snapshot.snails.map((snail) => ({
          id: snail.id,
          name: snail.name,
          status: snail.status,
          user_id: userId
        })),
        { onConflict: "user_id,id" }
      );

      assertNoSupabaseError(result.error, "save snails");
    }

    if (snapshot.reminders.length > 0) {
      const result = await this.client.from("reminders").upsert(
        snapshot.reminders.map((reminder) => ({
          created_at: toIso(reminder.createdAtMs),
          delivered_at:
            reminder.deliveredAtMs === undefined
              ? null
              : toIso(reminder.deliveredAtMs),
          id: reminder.id,
          snail_id: reminder.snailId,
          status: reminder.status,
          text: reminder.text,
          user_id: userId
        })),
        { onConflict: "user_id,id" }
      );

      assertNoSupabaseError(result.error, "save reminders");
    }

    if (snapshot.journeys.length > 0) {
      const result = await this.client.from("journeys").upsert(
        snapshot.journeys.map((journey) => ({
          arrived_at:
            journey.arrivedAtMs === undefined ? null : toIso(journey.arrivedAtMs),
          base_speed_meters_per_hour: journey.speedMetersPerHour,
          created_at: toIso(journey.createdAtMs),
          id: journey.id,
          reminder_id: journey.reminderId,
          snail_id: journey.snailId,
          start_latitude: journey.start.latitude,
          start_longitude: journey.start.longitude,
          status: journey.status,
          target_latitude: journey.target.latitude,
          target_longitude: journey.target.longitude,
          user_id: userId
        })),
        { onConflict: "user_id,id" }
      );

      assertNoSupabaseError(result.error, "save journeys");
    }
  }
}

function mapCarrierUser(row: CarrierUserRow): CarrierUser {
  return {
    authUserId: row.auth_user_id,
    createdAtMs: fromIso(row.created_at),
    id: row.id
  };
}

function mapSnail(row: SnailRow): Snail {
  return {
    id: row.id,
    name: row.name,
    status: row.status
  };
}

function mapReminder(row: ReminderRow): Reminder {
  return {
    createdAtMs: fromIso(row.created_at),
    deliveredAtMs: row.delivered_at ? fromIso(row.delivered_at) : undefined,
    id: row.id,
    snailId: row.snail_id,
    status: row.status,
    text: row.text
  };
}

function mapJourney(row: JourneyRow): JourneyRecord {
  return {
    arrivedAtMs: row.arrived_at ? fromIso(row.arrived_at) : undefined,
    createdAtMs: fromIso(row.created_at),
    id: row.id,
    reminderId: row.reminder_id,
    snailId: row.snail_id,
    speedMetersPerHour: row.base_speed_meters_per_hour,
    start: {
      latitude: row.start_latitude,
      longitude: row.start_longitude
    },
    status: row.status,
    target: {
      latitude: row.target_latitude,
      longitude: row.target_longitude
    }
  };
}

function assertNoSupabaseError(
  error: PostgrestError | null,
  action: string
): void {
  if (error) {
    throw new Error(`Supabase ${action} failed: ${error.message}`);
  }
}

function asRows<Row>(data: unknown): Row[] {
  return Array.isArray(data) ? (data as Row[]) : [];
}

function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

function fromIso(value: string): number {
  return new Date(value).getTime();
}
