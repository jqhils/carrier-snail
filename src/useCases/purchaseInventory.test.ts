import {
  createInitialCarrierState,
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
  purchaseInventory,
  type EntitlementProvider,
  type PurchaseAuthorization,
  type PurchaseProductId
} from "./purchaseInventory";

const target = {
  latitude: -33.8688,
  longitude: 151.2093
};

class FakeEntitlementProvider implements EntitlementProvider {
  readonly purchasedProductIds: PurchaseProductId[] = [];

  async purchase(productId: PurchaseProductId): Promise<PurchaseAuthorization> {
    this.purchasedProductIds.push(productId);

    return {
      productId,
      purchaseId: `sandbox-${this.purchasedProductIds.length}`,
      purchasedAtMs: 5000
    };
  }
}

describe("purchaseInventory", () => {
  it("discloses paid egg odds before purchase", () => {
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
  });

  it("uses entitlements to grant purchased eggs", async () => {
    const repository = new InMemoryCarrierRepository(createInitialCarrierState());
    const entitlementProvider = new FakeEntitlementProvider();

    await purchaseInventory(
      { productId: "egg-pack-small" },
      {
        clock: { now: () => 4000 },
        entitlementProvider,
        repository
      }
    );
    const state = repository.snapshot();

    expect(entitlementProvider.purchasedProductIds).toEqual(["egg-pack-small"]);
    expect(state.eggs).toEqual([
      {
        earnedAtMs: 5000,
        id: "egg-1",
        rarityPool: "paid-premium",
        source: "purchased",
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
      }
    ]);
    expect(state.purchases).toEqual([
      {
        id: "sandbox-1",
        productId: "egg-pack-small",
        purchasedAtMs: 5000
      }
    ]);
  });

  it("uses entitlements to grant cosmetics and stable slots", async () => {
    const repository = new InMemoryCarrierRepository(createInitialCarrierState());
    const entitlementProvider = new FakeEntitlementProvider();

    await purchaseInventory(
      { productId: "cosmetic-trail-sparkle" },
      {
        clock: { now: () => 4000 },
        entitlementProvider,
        repository
      }
    );
    await purchaseInventory(
      { productId: "stable-slot-single" },
      {
        clock: { now: () => 6000 },
        entitlementProvider,
        repository
      }
    );
    const state = repository.snapshot();

    expect(state.inventory.cosmetics).toEqual([
      {
        acquiredAtMs: 5000,
        id: "trail-sparkle",
        name: "Sparkling trail",
        source: "purchased"
      }
    ]);
    expect(state.stableSlots).toEqual({ purchased: 1 });
    expect(listStableSnails(state).capacity).toMatchObject({
      emptySlotCount: 1,
      totalCount: 2
    });
  });

  it("does not let a purchased empty slot bypass the resting-snail rule", async () => {
    const repository = new InMemoryCarrierRepository(createInitialCarrierState());
    const entitlementProvider = new FakeEntitlementProvider();

    await purchaseInventory(
      { productId: "stable-slot-single" },
      {
        clock: { now: () => 0 },
        entitlementProvider,
        repository
      }
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
});
