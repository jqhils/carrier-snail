import type { Clock } from "./createReminderJourney";
import { getEggRarityPoolOdds, type RarityPoolOdd } from "./hatchEgg";
import type {
  CarrierRepository,
  CosmeticId,
  CosmeticInventoryItem,
  Egg,
  EggRarityPool,
  PurchaseProductId
} from "./localCarrierState";

export type { PurchaseProductId } from "./localCarrierState";

export type PurchaseAuthorization = {
  productId: PurchaseProductId;
  purchaseId: string;
  purchasedAtMs?: number;
};

export type EntitlementProvider = {
  purchase(productId: PurchaseProductId): Promise<PurchaseAuthorization>;
};

export type PurchaseGrant =
  | {
      count: number;
      kind: "eggs";
      rarityPool: EggRarityPool;
    }
  | {
      cosmeticId: CosmeticId;
      cosmeticName: string;
      kind: "cosmetic";
    }
  | {
      count: number;
      kind: "stable-slot";
    };

export type PurchaseCatalogProduct = {
  description: string;
  grant: PurchaseGrant;
  id: PurchaseProductId;
  label: string;
  odds?: RarityPoolOdd[];
};

export type PurchaseInventoryInput = {
  productId: PurchaseProductId;
};

export class UnknownPurchaseProductError extends Error {
  constructor(productId: string) {
    super(`Unknown purchase product: ${productId}`);
    this.name = "UnknownPurchaseProductError";
  }
}

export class PurchaseAuthorizationMismatchError extends Error {
  constructor() {
    super("Purchase authorization did not match the requested product.");
    this.name = "PurchaseAuthorizationMismatchError";
  }
}

export const PURCHASE_FLOOR_DISCLOSURE =
  "Purchases never make a reminder arrive sooner than 24 hours or 40% of honest distance-time.";

const PURCHASE_CATALOG: PurchaseCatalogProduct[] = [
  {
    description: "Three premium eggs.",
    grant: {
      count: 3,
      kind: "eggs",
      rarityPool: "paid-premium"
    },
    id: "egg-pack-small",
    label: "Egg pack",
    odds: getEggRarityPoolOdds("paid-premium")
  },
  {
    description: "A sparkling trail cosmetic.",
    grant: {
      cosmeticId: "trail-sparkle",
      cosmeticName: "Sparkling trail",
      kind: "cosmetic"
    },
    id: "cosmetic-trail-sparkle",
    label: "Sparkling trail"
  },
  {
    description: "One extra stable slot.",
    grant: {
      count: 1,
      kind: "stable-slot"
    },
    id: "stable-slot-single",
    label: "Stable slot"
  }
];

export function getPurchaseCatalog(): PurchaseCatalogProduct[] {
  return PURCHASE_CATALOG.map((product) => ({
    ...product,
    grant: { ...product.grant },
    odds: product.odds?.map((odd) => ({ ...odd }))
  }));
}

export async function purchaseInventory(
  input: PurchaseInventoryInput,
  {
    clock,
    entitlementProvider,
    repository
  }: {
    clock: Clock;
    entitlementProvider: EntitlementProvider;
    repository: CarrierRepository;
  }
): Promise<void> {
  const product = findProduct(input.productId);
  const authorization = await entitlementProvider.purchase(input.productId);
  const purchasedAtMs = authorization.purchasedAtMs ?? clock.now();
  const state = repository.snapshot();

  if (authorization.productId !== input.productId) {
    throw new PurchaseAuthorizationMismatchError();
  }

  if (state.purchases.some((purchase) => purchase.id === authorization.purchaseId)) {
    return;
  }

  repository.save({
    ...applyGrant({
      product,
      purchasedAtMs,
      state
    }),
    purchases: [
      ...state.purchases,
      {
        id: authorization.purchaseId,
        productId: authorization.productId,
        purchasedAtMs
      }
    ]
  });
}

function findProduct(productId: PurchaseProductId): PurchaseCatalogProduct {
  const product = PURCHASE_CATALOG.find((candidate) => candidate.id === productId);

  if (!product) {
    throw new UnknownPurchaseProductError(productId);
  }

  return product;
}

function applyGrant({
  product,
  purchasedAtMs,
  state
}: {
  product: PurchaseCatalogProduct;
  purchasedAtMs: number;
  state: ReturnType<CarrierRepository["snapshot"]>;
}): ReturnType<CarrierRepository["snapshot"]> {
  if (product.grant.kind === "eggs") {
    const eggs = createPurchasedEggs({
      count: product.grant.count,
      purchasedAtMs,
      rarityPool: product.grant.rarityPool,
      startingSequence: state.eggs.length + 1
    });

    return {
      ...state,
      eggs: [...state.eggs, ...eggs]
    };
  }

  if (product.grant.kind === "cosmetic") {
    const cosmetic: CosmeticInventoryItem = {
      acquiredAtMs: purchasedAtMs,
      id: product.grant.cosmeticId,
      name: product.grant.cosmeticName,
      source: "purchased"
    };
    const alreadyOwned = state.inventory.cosmetics.some(
      (candidate) => candidate.id === cosmetic.id
    );

    return {
      ...state,
      inventory: {
        cosmetics: alreadyOwned
          ? state.inventory.cosmetics
          : [...state.inventory.cosmetics, cosmetic]
      }
    };
  }

  return {
    ...state,
    stableSlots: {
      purchased: state.stableSlots.purchased + product.grant.count
    }
  };
}

function createPurchasedEggs({
  count,
  purchasedAtMs,
  rarityPool,
  startingSequence
}: {
  count: number;
  purchasedAtMs: number;
  rarityPool: EggRarityPool;
  startingSequence: number;
}): Egg[] {
  return Array.from({ length: count }, (_, index) => ({
    earnedAtMs: purchasedAtMs,
    id: `egg-${startingSequence + index}`,
    rarityPool,
    source: "purchased",
    status: "unhatched"
  }));
}
