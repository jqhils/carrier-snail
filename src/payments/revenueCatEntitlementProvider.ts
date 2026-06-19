import { Platform } from "react-native";
import Purchases, {
  type PurchasesPackage
} from "react-native-purchases";

import type { PurchaseProductId } from "../useCases/localCarrierState";
import type {
  EntitlementProvider,
  PurchaseAuthorization
} from "../useCases/purchaseInventory";

export type RevenueCatEntitlementProviderConfig = {
  androidApiKey?: string;
  appUserId?: string;
  iosApiKey?: string;
  productIdentifiers?: Partial<Record<PurchaseProductId, string>>;
};

export class RevenueCatProductUnavailableError extends Error {
  constructor(productId: PurchaseProductId) {
    super(`RevenueCat product is unavailable: ${productId}`);
    this.name = "RevenueCatProductUnavailableError";
  }
}

export class RevenueCatEntitlementProvider implements EntitlementProvider {
  private configured = false;

  constructor(
    private readonly config: {
      apiKey: string;
      appUserId?: string;
      productIdentifiers: Record<PurchaseProductId, string>;
    }
  ) {}

  async purchase(productId: PurchaseProductId): Promise<PurchaseAuthorization> {
    this.configureOnce();

    const revenueCatProductId = this.config.productIdentifiers[productId];
    const offerings = await Purchases.getOfferings();
    const packages = Object.values(offerings.all).flatMap(
      (offering) => offering.availablePackages
    );
    const packageToPurchase = packages.find((candidate) =>
      packageMatchesProduct(candidate, revenueCatProductId)
    );

    if (!packageToPurchase) {
      throw new RevenueCatProductUnavailableError(productId);
    }

    const result = await Purchases.purchasePackage(packageToPurchase);

    return {
      productId,
      purchaseId: `${result.productIdentifier}:${Date.now()}`
    };
  }

  private configureOnce(): void {
    if (this.configured) {
      return;
    }

    Purchases.configure({
      apiKey: this.config.apiKey,
      appUserID: this.config.appUserId
    });
    this.configured = true;
  }
}

export function createRevenueCatEntitlementProvider(
  config: RevenueCatEntitlementProviderConfig
): RevenueCatEntitlementProvider | null {
  const apiKey = Platform.OS === "ios" ? config.iosApiKey : config.androidApiKey;

  if (!apiKey) {
    return null;
  }

  return new RevenueCatEntitlementProvider({
    apiKey,
    appUserId: config.appUserId,
    productIdentifiers: {
      ...DEFAULT_REVENUECAT_PRODUCT_IDENTIFIERS,
      ...config.productIdentifiers
    }
  });
}

const DEFAULT_REVENUECAT_PRODUCT_IDENTIFIERS: Record<
  PurchaseProductId,
  string
> = {
  "cosmetic-trail-sparkle": "cosmetic-trail-sparkle",
  "egg-pack-small": "egg-pack-small",
  "stable-slot-single": "stable-slot-single"
};

function packageMatchesProduct(
  candidate: PurchasesPackage,
  revenueCatProductId: string
): boolean {
  return (
    candidate.identifier === revenueCatProductId ||
    candidate.product.identifier === revenueCatProductId
  );
}
