import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import {
  type ArrivalNotification,
  cloneCarrierState,
  createStarterGardenSnail,
  type CarrierState,
  type CosmeticId,
  type Egg,
  type Inventory,
  type JourneyRecord,
  type PurchaseProductId,
  type PurchaseRecord,
  type Reminder,
  type Snail,
  type ToDo,
  type TrailHistoryPoint
} from "../useCases/localCarrierState";
import {
  getDefaultSnailSpeciesIdForRarity,
  isSnailSpeciesId
} from "../useCases/snailSpecies";
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
  inventory: unknown;
  onboarding_completed_at: string | null;
  purchase_records: unknown;
  purchased_stable_slots: number;
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
  species_id: unknown;
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

type TodoRow = {
  created_at: string;
  done_at: string | null;
  id: string;
  status: ToDo["status"];
  text: string;
};

type ArrivalRow = {
  arrived_at: string;
  id: string;
  journey_id: string;
  reminder_id: string | null;
  seen_at: string | null;
  snail_id: string;
  snail_name: string;
  text: string;
  todo_id: string | null;
};

type JourneyRow = {
  arrived_at: string | null;
  base_speed_meters_per_hour: number;
  created_at: string;
  id: string;
  recalled_at: string | null;
  reminder_id: string | null;
  snail_id: string;
  start_latitude: number;
  start_longitude: number;
  status: JourneyRecord["status"];
  target_latitude: number;
  target_longitude: number;
  todo_id: string | null;
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

  async savePushToken(userId: string, token: string): Promise<void> {
    const result = await this.client
      .from("carrier_users")
      .update({ push_token: token })
      .eq("id", userId);

    assertNoSupabaseError(result.error, "save push token");
  }

  async loadCarrierState(userId: string): Promise<CarrierState> {
    const [userState, snails, reminders, todos, journeys, eggs, arrivals] =
      await Promise.all([
        this.client
          .from("carrier_users")
          .select(
            "soft_currency_slime, inventory, purchase_records, purchased_stable_slots, onboarding_completed_at"
          )
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
              "species_id",
              "appearance",
              "trail_traits"
            ].join(", ")
          )
          .eq("user_id", userId)
          .is("released_at", null)
          .order("created_at", { ascending: true }),
        this.client
          .from("reminders")
          .select(
            "id, snail_id, text, status, created_at, delivered_at, recalled_at"
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: true }),
        this.client
          .from("todos")
          .select("id, text, status, created_at, done_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: true }),
        this.client
          .from("journeys")
          .select(
            [
              "id",
              "reminder_id",
              "todo_id",
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
          .order("created_at", { ascending: true }),
        this.client
          .from("arrival_notifications")
          .select(
            [
              "id",
              "journey_id",
              "todo_id",
              "reminder_id",
              "snail_id",
              "snail_name",
              "text",
              "arrived_at",
              "seen_at"
            ].join(", ")
          )
          .eq("user_id", userId)
          .order("arrived_at", { ascending: true })
      ]);

    assertNoSupabaseError(userState.error, "load user state");
    assertNoSupabaseError(snails.error, "load snails");
    assertNoSupabaseError(reminders.error, "load reminders");
    assertNoSupabaseError(todos.error, "load todos");
    assertNoSupabaseError(journeys.error, "load journeys");
    assertNoSupabaseError(eggs.error, "load eggs");
    assertNoSupabaseError(arrivals.error, "load arrival notifications");

    const mappedUserState = mapUserState(
      userState.data as CarrierUserStateRow | null
    );

    const mappedReminders = asRows<ReminderRow>(reminders.data).map(mapReminder);
    const mappedTodos = asRows<TodoRow>(todos.data).map(mapTodo);

    return {
      arrivals: asRows<ArrivalRow>(arrivals.data).map(mapArrival),
      eggs: asRows<EggRow>(eggs.data).map(mapEgg),
      inventory: mappedUserState.inventory,
      journeys: asRows<JourneyRow>(journeys.data).map(mapJourney),
      onboarding: mappedUserState.onboarding,
      purchases: mappedUserState.purchases,
      reminders: mappedReminders,
      snails: asRows<SnailRow>(snails.data).map(mapSnail),
      softCurrency: mappedUserState.softCurrency,
      stableSlots: mappedUserState.stableSlots,
      todos:
        mappedTodos.length > 0 ? mappedTodos : mappedReminders.map(mapReminderToTodo)
    };
  }

  async saveCarrierState(userId: string, state: CarrierState): Promise<void> {
    const snapshot = cloneCarrierState(state);
    const snailIds = snapshot.snails.map(({ id }) => id);
    const todoIds = snapshot.todos.map(({ id }) => id);
    const todoIdSet = new Set(todoIds);

    const userState = await this.client
      .from("carrier_users")
      .update({
        inventory: snapshot.inventory,
        onboarding_completed_at:
          snapshot.onboarding?.completedAtMs === undefined
            ? null
            : toIso(snapshot.onboarding.completedAtMs),
        purchase_records: snapshot.purchases,
        purchased_stable_slots: snapshot.stableSlots.purchased,
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
          released_at: null,
          speed_band: snail.speedBand,
          species_id: snail.speciesId,
          status: snail.status,
          temperament: snail.temperament,
          trail_traits: snail.trail,
          user_id: userId
        })),
        { onConflict: "user_id,id" }
      );

      assertNoSupabaseError(result.error, "save snails");
    }

    await this.markMissingRestingSnailsReleased(userId, snailIds);

    if (snapshot.todos.length > 0) {
      const result = await this.client.from("todos").upsert(
        snapshot.todos.map((todo) => ({
          created_at: toIso(todo.createdAtMs),
          done_at: todo.doneAtMs === undefined ? null : toIso(todo.doneAtMs),
          id: todo.id,
          status: todo.status,
          text: todo.text,
          user_id: userId
        })),
        { onConflict: "user_id,id" }
      );

      assertNoSupabaseError(result.error, "save todos");
    }

    await this.clearMissingTodoReferences(userId, todoIds);
    await this.deleteMissingTodos(userId, todoIds);

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
          reminder_id: journey.reminderId ?? null,
          snail_id: journey.snailId,
          start_latitude: journey.start.latitude,
          start_longitude: journey.start.longitude,
          status: journey.status,
          target_latitude: journey.target.latitude,
          target_longitude: journey.target.longitude,
          todo_id:
            journey.todoId && todoIdSet.has(journey.todoId)
              ? journey.todoId
              : null,
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

    if (snapshot.arrivals.length > 0) {
      const result = await this.client.from("arrival_notifications").upsert(
        snapshot.arrivals.map((arrival) => ({
          arrived_at: toIso(arrival.arrivedAtMs),
          id: arrival.id,
          journey_id: arrival.journeyId,
          reminder_id: arrival.reminderId ?? null,
          seen_at:
            arrival.seenAtMs === undefined ? null : toIso(arrival.seenAtMs),
          snail_id: arrival.snailId,
          snail_name: arrival.snailName,
          text: arrival.text,
          todo_id: arrival.todoId ?? null,
          user_id: userId
        })),
        { onConflict: "user_id,id" }
      );

      assertNoSupabaseError(result.error, "save arrival notifications");
    }
  }

  private async clearMissingTodoReferences(
    userId: string,
    todoIds: string[]
  ): Promise<void> {
    const result =
      todoIds.length === 0
        ? await this.client
            .from("journeys")
            .update({ todo_id: null })
            .eq("user_id", userId)
            .not("todo_id", "is", null)
        : await this.client
            .from("journeys")
            .update({ todo_id: null })
            .eq("user_id", userId)
            .not("todo_id", "in", formatPostgrestTextInFilter(todoIds));

    assertNoSupabaseError(result.error, "clear deleted to-do journey links");
  }

  private async deleteMissingTodos(
    userId: string,
    todoIds: string[]
  ): Promise<void> {
    const result =
      todoIds.length === 0
        ? await this.client.from("todos").delete().eq("user_id", userId)
        : await this.client
            .from("todos")
            .delete()
            .eq("user_id", userId)
            .not("id", "in", formatPostgrestTextInFilter(todoIds));

    assertNoSupabaseError(result.error, "delete removed todos");
  }

  private async markMissingRestingSnailsReleased(
    userId: string,
    snailIds: string[]
  ): Promise<void> {
    const releasedAt = new Date().toISOString();
    const result =
      snailIds.length === 0
        ? await this.client
            .from("snails")
            .update({ released_at: releasedAt })
            .eq("user_id", userId)
            .eq("status", "resting")
            .is("released_at", null)
        : await this.client
            .from("snails")
            .update({ released_at: releasedAt })
            .eq("user_id", userId)
            .eq("status", "resting")
            .is("released_at", null)
            .not("id", "in", formatPostgrestTextInFilter(snailIds));

    assertNoSupabaseError(result.error, "mark released snails");
  }
}

function mapCarrierUser(row: CarrierUserRow): CarrierUser {
  return {
    authUserId: row.auth_user_id,
    createdAtMs: fromIso(row.created_at),
    id: row.id
  };
}

function mapUserState(row: CarrierUserStateRow | null): Pick<
  CarrierState,
  "inventory" | "onboarding" | "purchases" | "softCurrency" | "stableSlots"
> {
  return {
    inventory: mapInventory(row?.inventory),
    onboarding: {
      completedAtMs: row?.onboarding_completed_at
        ? fromIso(row.onboarding_completed_at)
        : undefined
    },
    purchases: mapPurchases(row?.purchase_records),
    softCurrency: {
      slime: finiteNumber(row?.soft_currency_slime) ?? 0
    },
    stableSlots: {
      purchased: finiteNumber(row?.purchased_stable_slots) ?? 0
    }
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
    speciesId: mapSpeciesId(row.species_id, row.rarity ?? fallback.rarity),
    status: row.status,
    temperament: row.temperament ?? fallback.temperament,
    trail: mapTrail(row.trail_traits, fallback.trail)
  };
}

function mapSpeciesId(
  value: unknown,
  rarity: Snail["rarity"]
): Snail["speciesId"] {
  return isSnailSpeciesId(value)
    ? value
    : getDefaultSnailSpeciesIdForRarity(rarity);
}

function mapInventory(value: unknown): Inventory {
  if (!isRecord(value) || !Array.isArray(value.cosmetics)) {
    return { cosmetics: [] };
  }

  return {
    cosmetics: value.cosmetics.flatMap((cosmetic) => {
      if (!isRecord(cosmetic) || !isCosmeticId(cosmetic.id)) {
        return [];
      }

      return [
        {
          acquiredAtMs: finiteNumber(cosmetic.acquiredAtMs) ?? 0,
          id: cosmetic.id,
          name: typeof cosmetic.name === "string" ? cosmetic.name : cosmetic.id,
          source: "purchased" as const
        }
      ];
    })
  };
}

function mapPurchases(value: unknown): PurchaseRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((purchase) => {
    if (!isRecord(purchase) || !isPurchaseProductId(purchase.productId)) {
      return [];
    }

    return [
      {
        id: typeof purchase.id === "string" ? purchase.id : purchase.productId,
        productId: purchase.productId,
        purchasedAtMs: finiteNumber(purchase.purchasedAtMs) ?? 0
      }
    ];
  });
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

function mapTodo(row: TodoRow): ToDo {
  return {
    createdAtMs: fromIso(row.created_at),
    doneAtMs: row.done_at ? fromIso(row.done_at) : undefined,
    id: row.id,
    status: row.status,
    text: row.text
  };
}

function mapArrival(row: ArrivalRow): ArrivalNotification {
  return {
    arrivedAtMs: fromIso(row.arrived_at),
    id: row.id,
    journeyId: row.journey_id,
    reminderId: row.reminder_id ?? undefined,
    seenAtMs: row.seen_at ? fromIso(row.seen_at) : undefined,
    snailId: row.snail_id,
    snailName: row.snail_name,
    text: row.text,
    todoId: row.todo_id ?? undefined
  };
}

function mapReminderToTodo(reminder: Reminder): ToDo {
  return {
    createdAtMs: reminder.createdAtMs,
    id: reminder.id,
    status: "open",
    text: reminder.text
  };
}

function mapJourney(row: JourneyRow): JourneyRecord {
  return {
    arrivedAtMs: row.arrived_at ? fromIso(row.arrived_at) : undefined,
    createdAtMs: fromIso(row.created_at),
    id: row.id,
    recalledAtMs: row.recalled_at ? fromIso(row.recalled_at) : undefined,
    reminderId: row.reminder_id ?? undefined,
    snailId: row.snail_id,
    speedMetersPerHour: row.base_speed_meters_per_hour,
    start: {
      latitude: row.start_latitude,
      longitude: row.start_longitude
    },
    status: row.status,
    todoId: row.todo_id ?? row.reminder_id ?? undefined,
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

function isCosmeticId(value: unknown): value is CosmeticId {
  return value === "trail-sparkle";
}

function isPurchaseProductId(value: unknown): value is PurchaseProductId {
  return (
    value === "egg-pack-small" ||
    value === "cosmetic-trail-sparkle" ||
    value === "stable-slot-single"
  );
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

function formatPostgrestTextInFilter(values: string[]): string {
  return `(${values.map(formatPostgrestTextValue).join(",")})`;
}

function formatPostgrestTextValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

function fromIso(value: string): number {
  return new Date(value).getTime();
}
