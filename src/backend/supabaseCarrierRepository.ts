import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import {
  cloneCarrierState,
  createStarterGardenSnail,
  type CarrierState,
  type Egg,
  type JourneyRecord,
  type Reminder,
  type Snail,
  type TrailHistoryPoint
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

type CarrierUserStateRow = {
  soft_currency_slime: number;
};

type SnailRow = {
  appearance: unknown;
  base_speed_meters_per_hour: number;
  experience_points: number;
  id: string;
  journeys_completed: number;
  level: number;
  name: string;
  quirk: Snail["quirk"];
  quirk_seed: string;
  rarity: Snail["rarity"];
  reliability: number;
  speed_band: Snail["speedBand"];
  status: Snail["status"];
  temperament: Snail["temperament"];
  trail_traits: unknown;
};

type ReminderRow = {
  created_at: string;
  delivered_at: string | null;
  id: string;
  recalled_at: string | null;
  snail_id: string;
  status: Reminder["status"];
  text: string;
};

type JourneyRow = {
  arrived_at: string | null;
  base_speed_meters_per_hour: number;
  created_at: string;
  id: string;
  recalled_at: string | null;
  reminder_id: string;
  snail_id: string;
  start_latitude: number;
  start_longitude: number;
  status: JourneyRecord["status"];
  target_latitude: number;
  target_longitude: number;
  trail_history: TrailHistoryPoint[] | null;
};

type EggRow = {
  earned_at: string;
  hatched_at: string | null;
  hatched_snail_id: string | null;
  id: string;
  rarity_pool: Egg["rarityPool"];
  source: Egg["source"];
  status: Egg["status"];
};

export class SupabaseCarrierRepository implements BackendCarrierRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listUserIdsWithPendingJourneys(): Promise<string[]> {
    const result = await this.client
      .from("journeys")
      .select("user_id")
      .eq("status", "in-flight");

    assertNoSupabaseError(result.error, "load users with pending journeys");

    return [
      ...new Set(
        asRows<{ user_id: string }>(result.data).map(({ user_id }) => user_id)
      )
    ];
  }

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
    const [userState, snails, reminders, journeys, eggs] = await Promise.all([
      this.client
        .from("carrier_users")
        .select("soft_currency_slime")
        .eq("id", userId)
        .maybeSingle(),
      this.client
        .from("snails")
        .select(
          [
            "id",
            "name",
            "status",
            "rarity",
            "level",
            "experience_points",
            "journeys_completed",
            "base_speed_meters_per_hour",
            "quirk_seed",
            "temperament",
            "speed_band",
            "reliability",
            "quirk",
            "appearance",
            "trail_traits"
          ].join(", ")
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      this.client
        .from("reminders")
        .select(
          "id, snail_id, text, status, created_at, delivered_at, recalled_at"
        )
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
            "recalled_at",
            "start_latitude",
            "start_longitude",
            "target_latitude",
            "target_longitude",
            "base_speed_meters_per_hour",
            "trail_history"
          ].join(", ")
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      this.client
        .from("eggs")
        .select(
          "id, source, status, rarity_pool, earned_at, hatched_at, hatched_snail_id"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
    ]);

    assertNoSupabaseError(userState.error, "load user state");
    assertNoSupabaseError(snails.error, "load snails");
    assertNoSupabaseError(reminders.error, "load reminders");
    assertNoSupabaseError(journeys.error, "load journeys");
    assertNoSupabaseError(eggs.error, "load eggs");

    return {
      eggs: asRows<EggRow>(eggs.data).map(mapEgg),
      journeys: asRows<JourneyRow>(journeys.data).map(mapJourney),
      reminders: asRows<ReminderRow>(reminders.data).map(mapReminder),
      snails: asRows<SnailRow>(snails.data).map(mapSnail),
      softCurrency: {
        slime:
          finiteNumber((userState.data as CarrierUserStateRow | null)?.soft_currency_slime) ??
          0
      }
    };
  }

  async saveCarrierState(userId: string, state: CarrierState): Promise<void> {
    const snapshot = cloneCarrierState(state);

    const userState = await this.client
      .from("carrier_users")
      .update({
        soft_currency_slime: snapshot.softCurrency.slime,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    assertNoSupabaseError(userState.error, "save user state");

    if (snapshot.snails.length > 0) {
      const result = await this.client.from("snails").upsert(
        snapshot.snails.map((snail) => ({
          appearance: snail.appearance,
          base_speed_meters_per_hour: snail.baseSpeedMetersPerHour,
          experience_points: snail.experiencePoints,
          id: snail.id,
          journeys_completed: snail.journeysCompleted,
          level: snail.level,
          name: snail.name,
          quirk: snail.quirk,
          quirk_seed: snail.quirkSeed,
          rarity: snail.rarity,
          reliability: snail.reliability,
          speed_band: snail.speedBand,
          status: snail.status,
          temperament: snail.temperament,
          trail_traits: snail.trail,
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
          recalled_at:
            reminder.recalledAtMs === undefined
              ? null
              : toIso(reminder.recalledAtMs),
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
          recalled_at:
            journey.recalledAtMs === undefined ? null : toIso(journey.recalledAtMs),
          reminder_id: journey.reminderId,
          snail_id: journey.snailId,
          start_latitude: journey.start.latitude,
          start_longitude: journey.start.longitude,
          status: journey.status,
          target_latitude: journey.target.latitude,
          target_longitude: journey.target.longitude,
          trail_history: journey.trailHistory ?? [],
          user_id: userId
        })),
        { onConflict: "user_id,id" }
      );

      assertNoSupabaseError(result.error, "save journeys");
    }

    if (snapshot.eggs.length > 0) {
      const result = await this.client.from("eggs").upsert(
        snapshot.eggs.map((egg) => ({
          earned_at: toIso(egg.earnedAtMs),
          hatched_at:
            egg.hatchedAtMs === undefined ? null : toIso(egg.hatchedAtMs),
          hatched_snail_id: egg.hatchedSnailId ?? null,
          id: egg.id,
          rarity_pool: egg.rarityPool,
          source: egg.source,
          status: egg.status,
          user_id: userId
        })),
        { onConflict: "user_id,id" }
      );

      assertNoSupabaseError(result.error, "save eggs");
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
  const fallback = createStarterGardenSnail();

  return {
    appearance: mapAppearance(row.appearance, fallback.appearance),
    baseSpeedMetersPerHour:
      finiteNumber(row.base_speed_meters_per_hour) ??
      fallback.baseSpeedMetersPerHour,
    experiencePoints:
      finiteNumber(row.experience_points) ?? fallback.experiencePoints,
    id: row.id,
    journeysCompleted:
      finiteNumber(row.journeys_completed) ?? fallback.journeysCompleted,
    level: finiteNumber(row.level) ?? fallback.level,
    name: row.name,
    quirk: row.quirk ?? fallback.quirk,
    quirkSeed: row.quirk_seed || fallback.quirkSeed,
    rarity: row.rarity ?? fallback.rarity,
    reliability: finiteNumber(row.reliability) ?? fallback.reliability,
    speedBand: row.speed_band ?? fallback.speedBand,
    status: row.status,
    temperament: row.temperament ?? fallback.temperament,
    trail: mapTrail(row.trail_traits, fallback.trail)
  };
}

function mapReminder(row: ReminderRow): Reminder {
  return {
    createdAtMs: fromIso(row.created_at),
    deliveredAtMs: row.delivered_at ? fromIso(row.delivered_at) : undefined,
    id: row.id,
    recalledAtMs: row.recalled_at ? fromIso(row.recalled_at) : undefined,
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
    recalledAtMs: row.recalled_at ? fromIso(row.recalled_at) : undefined,
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
    },
    trailHistory: mapTrailHistory(row.trail_history)
  };
}

function mapEgg(row: EggRow): Egg {
  return {
    earnedAtMs: fromIso(row.earned_at),
    hatchedAtMs: row.hatched_at ? fromIso(row.hatched_at) : undefined,
    hatchedSnailId: row.hatched_snail_id ?? undefined,
    id: row.id,
    rarityPool: row.rarity_pool ?? "earned-basic",
    source: row.source,
    status: row.status
  };
}

function mapAppearance(
  value: unknown,
  fallback: Snail["appearance"]
): Snail["appearance"] {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    bodyColor:
      typeof value.bodyColor === "string" ? value.bodyColor : fallback.bodyColor,
    shellColor:
      typeof value.shellColor === "string"
        ? value.shellColor
        : fallback.shellColor
  };
}

function mapTrail(value: unknown, fallback: Snail["trail"]): Snail["trail"] {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    color: typeof value.color === "string" ? value.color : fallback.color,
    persistenceMs:
      finiteNumber(value.persistenceMs) ?? fallback.persistenceMs,
    texture:
      value.texture === "sparkling" ||
      value.texture === "misty" ||
      value.texture === "inky" ||
      value.texture === "glistening"
        ? value.texture
        : fallback.texture
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function finiteNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function mapTrailHistory(
  trailHistory: TrailHistoryPoint[] | null
): TrailHistoryPoint[] | undefined {
  if (!Array.isArray(trailHistory) || trailHistory.length === 0) {
    return undefined;
  }

  return trailHistory.map((point) => ({
    coordinate: {
      latitude: point.coordinate.latitude,
      longitude: point.coordinate.longitude
    },
    recordedAtMs: point.recordedAtMs
  }));
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
