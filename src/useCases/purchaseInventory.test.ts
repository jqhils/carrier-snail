import {
  createInitialCarrierState,
  createStarterGardenSnail,
  InMemoryCarrierRepository,
  listStableSnails
} from "./localCarrierState";
import {
  createReminderJourney,
  NoRestingSnailError
} from "./createReminderJourney";
import { getEggRarityPoolOdds } from "./hatchEgg";
import {
  getPurchaseCatalog,
  InsufficientSlimeError,
  PURCHASE_FLOOR_DISCLOSURE,
  purchaseInventory
} from "./purchaseInventory";

const target = {
  latitude: -33.8688,
  longitude: 151.2093
};

function repositoryWithSlime(
  slime: number,
  overrides: Partial<ReturnType<typeof createInitialCarrierState>> = {}
) {
  return new InMemoryCarrierRepository({
    ...createInitialCarrierState(),
    ...overrides,
    softCurrency: { slime }
  });
}

describe("purchaseInventory", () => {
  it("exposes plain purchase copy that money cannot buy urgency", () => {
    expect(PURCHASE_FLOOR_DISCLOSURE).toContain("24 hours");
    expect(PURCHASE_FLOOR_DISCLOSURE).toContain("40%");
    expect(PURCHASE_FLOOR_DISCLOSURE).toContain("never");
  });

  it("discloses paid egg odds and a slime price before purchase", () => {
    const catalog = getPurchaseCatalog();
    const eggPack = catalog.find(({ id }) => id === "egg-pack-small");

    expect(eggPack).toMatchObject({
      grant: {
        count: 3,
        kind: "eggs",
        rarityPool: "paid-premium"
      },
      odds: getEggRarityPoolOdds("paid-premium")
    });
    expect(eggPack?.slimePrice).toBeGreaterThan(0);
  });

  it("spends slime to grant purchased eggs", () => {
    const repository = repositoryWithSlime(50);

    purchaseInventory(
      { productId: "egg-pack-small" },
      { clock: { now: () => 5000 }, repository }
    );
    const state = repository.snapshot();

    expect(state.eggs).toEqual([
      {
        earnedAtMs: 0,
        id: "egg-1",
        rarityPool: "earned-basic",
        source: "earned",
        status: "unhatched"
      },
      {
        earnedAtMs: 5000,
        id: "egg-2",
        rarityPool: "paid-premium",
        source: "purchased",
        status: "unhatched"
      },
      {
        earnedAtMs: 5000,
        id: "egg-3",
        rarityPool: "paid-premium",
        source: "purchased",
        status: "unhatched"
      },
      {
        earnedAtMs: 5000,
        id: "egg-4",
        rarityPool: "paid-premium",
        source: "purchased",
        status: "unhatched"
      }
    ]);
    expect(state.softCurrency.slime).toBe(25);
    expect(state.purchases).toEqual([
      { id: "slime-1", productId: "egg-pack-small", purchasedAtMs: 5000 }
    ]);
  });

  it("allows purchased eggs to queue when the stable is full", () => {
    const repository = repositoryWithSlime(50, {
      snails: Array.from({ length: 6 }, (_, index) => ({
        ...createStarterGardenSnail(),
        id: `snail-${index + 1}`
      }))
    });

    purchaseInventory(
      { productId: "egg-pack-small" },
      { clock: { now: () => 4000 }, repository }
    );
    const state = repository.snapshot();

    expect(state.snails).toHaveLength(6);
    expect(state.eggs).toHaveLength(4);
    expect(state.eggs.every((egg) => egg.status === "unhatched")).toBe(true);
  });

  it("spends slime to grant cosmetics and stable slots", () => {
    const repository = repositoryWithSlime(50);

    purchaseInventory(
      { productId: "cosmetic-trail-sparkle" },
      { clock: { now: () => 4000 }, repository }
    );
    purchaseInventory(
      { productId: "stable-slot-single" },
      { clock: { now: () => 6000 }, repository }
    );
    const state = repository.snapshot();

    expect(state.inventory.cosmetics).toEqual([
      {
        acquiredAtMs: 4000,
        id: "trail-sparkle",
        name: "Sparkling trail",
        source: "purchased"
      }
    ]);
    expect(state.stableSlots).toEqual({ purchased: 1 });
    expect(state.softCurrency.slime).toBe(15);
    expect(listStableSnails(state).capacity).toMatchObject({
      emptySlotCount: 6,
      freeSlots: 6,
      maxSlots: 7,
      totalCount: 7
    });
  });

  it("does not let a purchased empty slot bypass the resting-snail rule", () => {
    const repository = repositoryWithSlime(50);

    purchaseInventory(
      { productId: "stable-slot-single" },
      { clock: { now: () => 0 }, repository }
    );
    createReminderJourney(
      { text: "buy milk" },
      {
        clock: { now: () => 1000 },
        locationSource: { currentTarget: () => target },
        repository
      }
    );

    expect(() =>
      createReminderJourney(
        { text: "check passport" },
        {
          clock: { now: () => 2000 },
          locationSource: { currentTarget: () => target },
          repository
        }
      )
    ).toThrow(NoRestingSnailError);
  });

  it("rejects a purchase when slime is insufficient and leaves state untouched", () => {
    const repository = repositoryWithSlime(10);

    expect(() =>
      purchaseInventory(
        { productId: "egg-pack-small" },
        { clock: { now: () => 4000 }, repository }
      )
    ).toThrow(InsufficientSlimeError);
    expect(repository.snapshot().softCurrency.slime).toBe(10);
    expect(repository.snapshot().eggs).toEqual([
      {
        earnedAtMs: 0,
        id: "egg-1",
        rarityPool: "earned-basic",
        source: "earned",
        status: "unhatched"
      }
    ]);
  });
});
