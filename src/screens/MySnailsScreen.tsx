import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FadeInView } from "../components/FadeInView";
import { SnailSprite } from "../components/SnailSprite";
import { getEggRarityPoolOdds } from "../useCases/hatchEgg";
import {
  getStableSnailDetail,
  type CarrierState,
  type Egg,
  type EggRarityPool,
  type StableSnailDetail,
  type StableSnapshot
} from "../useCases/localCarrierState";
import type {
  PurchaseCatalogProduct,
  PurchaseProductId
} from "../useCases/purchaseInventory";
import { levelUpCost } from "../useCases/levelUpSnail";
import { PURCHASE_FLOOR_DISCLOSURE } from "../useCases/purchaseInventory";
import { MAX_SNAIL_NAME_LENGTH } from "../useCases/renameSnail";
import { EmptyTabScreen } from "./EmptyTabScreen";

type MySnailsScreenProps = {
  canPurchase: boolean;
  carrierState: CarrierState;
  formError: string;
  onBuyProduct: (productId: PurchaseProductId) => void;
  onHatchEgg: (eggId: string) => void;
  onLevelSelectedSnail: () => void;
  onRenameSnail: (snailId: string, name: string) => void;
  onSelectSnail: (snailId: string) => void;
  purchaseCatalog: PurchaseCatalogProduct[];
  selectedCanLevel: boolean;
  selectedSnailId: string;
  stable: StableSnapshot;
  unhatchedEggs: Egg[];
};

export function MySnailsScreen({
  canPurchase,
  carrierState,
  formError,
  onBuyProduct,
  onHatchEgg,
  onLevelSelectedSnail,
  onRenameSnail,
  onSelectSnail,
  purchaseCatalog,
  selectedCanLevel,
  selectedSnailId,
  stable,
  unhatchedEggs
}: MySnailsScreenProps) {
  const [detailSnailId, setDetailSnailId] = useState<string | undefined>();
  const detail = detailSnailId
    ? getStableSnailDetail(carrierState, detailSnailId)
    : undefined;

  if (stable.snails.length === 0) {
    return (
      <EmptyTabScreen
        body="The stable is quiet. Your first shell will have a soft place here."
        eyebrow="Stable"
        title="My Snails"
        tone="sage"
      />
    );
  }

  if (detail) {
    return (
      <SnailDetailView
        canLevel={detail.id === selectedSnailId && selectedCanLevel}
        detail={detail}
        formError={formError}
        levelCost={levelUpCost(detail)}
        onBack={() => setDetailSnailId(undefined)}
        onLevelSelectedSnail={onLevelSelectedSnail}
        onRenameSnail={onRenameSnail}
      />
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      <FadeInView>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>Stable</Text>
            <Text style={styles.title}>My Snails</Text>
          </View>
          <Text numberOfLines={3} style={styles.capacity}>
            {stable.capacity.freeCount} resting, {stable.capacity.busyCount} out,{" "}
            {stable.capacity.emptySlotCount} slots
          </Text>
        </View>

        <View style={styles.snailList}>
          {stable.snails.map((snail) => {
            const selected = snail.id === selectedSnailId;
            const ownedSnail = carrierState.snails.find(
              (candidate) => candidate.id === snail.id
            );

            return (
              <Pressable
                accessibilityLabel={`Open ${snail.name} details, ${snail.statusLabel}`}
                accessibilityRole="button"
                key={snail.id}
                onPress={() => {
                  onSelectSnail(snail.id);
                  setDetailSnailId(snail.id);
                }}
                style={({ pressed }) => [
                  styles.snailItem,
                  snail.status === "on-journey" ? styles.snailItemBusy : null,
                  selected ? styles.snailItemSelected : null,
                  pressed ? styles.snailItemPressed : null
                ]}
              >
                <View style={styles.snailRow}>
                  <SnailSprite
                    speciesId={snail.speciesId}
                    size={56}
                    walking={snail.status === "on-journey"}
                  />
                  <View style={styles.snailCopy}>
                    <View style={styles.snailIdentityRow}>
                      <Text numberOfLines={1} style={styles.snailName}>
                        {snail.name}
                      </Text>
                      <Text style={styles.snailStatus}>{snail.statusLabel}</Text>
                    </View>
                    <Text numberOfLines={1} style={styles.snailMeta}>
                      {snail.carryingText
                        ? `Carrying: ${snail.carryingText}`
                        : selected
                          ? "Selected"
                          : "Ready"}
                    </Text>
                    {ownedSnail ? (
                      <Text numberOfLines={1} style={styles.snailStats}>
                        Lv {ownedSnail.level} · {ownedSnail.rarity} ·{" "}
                        {Math.round(ownedSnail.baseSpeedMetersPerHour)} m/h ·{" "}
                        {Math.round(ownedSnail.reliability * 100)}%
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        {unhatchedEggs.length > 0 ? (
          <View style={styles.eggList}>
            {unhatchedEggs.map((egg) => (
              <View key={egg.id} style={styles.eggRow}>
                <View style={styles.eggCopy}>
                  <Text numberOfLines={1} style={styles.eggTitle}>
                    Earned egg
                  </Text>
                  <Text numberOfLines={2} style={styles.eggOdds}>
                    {formatOddsText(egg.rarityPool)}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Hatch ${egg.id}`}
                  onPress={() => onHatchEgg(egg.id)}
                  style={({ pressed }) => [
                    styles.hatchButton,
                    pressed ? styles.hatchButtonPressed : null
                  ]}
                >
                  <Text style={styles.hatchButtonText}>Hatch</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.quietEggState}>
            <Text style={styles.quietEggTitle}>No eggs waiting</Text>
            <Text style={styles.quietEggText}>
              Journeys that finish with care leave something warm behind.
            </Text>
          </View>
        )}

        <View style={styles.shopList}>
          <Text style={styles.shopDisclosure}>{PURCHASE_FLOOR_DISCLOSURE}</Text>
          {purchaseCatalog.map((product) => (
            <View key={product.id} style={styles.shopRow}>
              <View style={styles.shopCopy}>
                <Text numberOfLines={1} style={styles.shopTitle}>
                  {product.label}
                </Text>
                <Text numberOfLines={2} style={styles.shopDetail}>
                  {formatPurchaseDetail(product)}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Buy ${product.label}`}
                disabled={!canPurchase}
                onPress={() => onBuyProduct(product.id)}
                style={({ pressed }) => [
                  styles.buyButton,
                  !canPurchase ? styles.buyButtonDisabled : null,
                  pressed ? styles.buyButtonPressed : null
                ]}
              >
                <Text style={styles.buyButtonText}>Buy</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
      </FadeInView>
    </SafeAreaView>
  );
}

function SnailDetailView({
  canLevel,
  detail,
  formError,
  levelCost,
  onBack,
  onLevelSelectedSnail,
  onRenameSnail
}: {
  canLevel: boolean;
  detail: StableSnailDetail;
  formError: string;
  levelCost: number;
  onBack: () => void;
  onLevelSelectedSnail: () => void;
  onRenameSnail: (snailId: string, name: string) => void;
}) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      <FadeInView>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.detailTopBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to My Snails"
              onPress={onBack}
              style={({ pressed }) => [
                styles.backButton,
                pressed ? styles.backButtonPressed : null
              ]}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
            <Text style={styles.detailStatus}>{detail.statusLabel}</Text>
          </View>

          <View style={styles.detailHero}>
            <View style={styles.detailSpriteFrame}>
              <SnailSprite
                speciesId={detail.speciesId}
                size={132}
                walking={detail.status === "on-journey"}
              />
            </View>
            <View style={styles.detailHeroCopy}>
              <Text style={styles.eyebrow}>{detail.speciesName}</Text>
              <Text numberOfLines={2} style={styles.detailTitle}>
                {detail.name}
              </Text>
              <Text style={styles.detailLore}>{detail.lore}</Text>
            </View>
          </View>

          <RenameSnailRow
            formError={formError}
            key={detail.id}
            onRenameSnail={onRenameSnail}
            snail={detail}
          />

          <View style={styles.levelRow}>
            <View style={styles.levelCopy}>
              <Text style={styles.renameLabel}>Level</Text>
              <Text numberOfLines={1} style={styles.levelText}>
                Lv {detail.level}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Level ${detail.name}`}
              disabled={!canLevel}
              onPress={onLevelSelectedSnail}
              style={({ pressed }) => [
                styles.levelButton,
                !canLevel ? styles.levelButtonDisabled : null,
                pressed ? styles.levelButtonPressed : null
              ]}
            >
              <Text style={styles.levelButtonText}>Level {levelCost}</Text>
            </Pressable>
          </View>

          {detail.carryingText ? (
            <View style={styles.detailCarrying}>
              <Text style={styles.renameLabel}>Carrying</Text>
              <Text numberOfLines={2} style={styles.detailCarryingText}>
                {detail.carryingText}
              </Text>
            </View>
          ) : null}

          <View style={styles.detailStatsGrid}>
            <DetailStat label="Rarity" value={formatLabel(detail.rarity)} />
            <DetailStat
              label="Speed"
              value={`${Math.round(detail.baseSpeedMetersPerHour)} m/h`}
            />
            <DetailStat
              label="Reliability"
              value={`${Math.round(detail.reliability * 100)}%`}
            />
            <DetailStat
              label="Temperament"
              value={formatLabel(detail.temperament)}
            />
            <DetailStat label="Quirk" value={formatLabel(detail.quirk)} />
            <DetailStat label="Speed band" value={formatLabel(detail.speedBand)} />
            <DetailStat
              label="Trail"
              value={formatLabel(detail.trail.texture)}
            />
            <DetailStat
              label="Journeys completed"
              value={String(detail.journeysCompleted)}
            />
          </View>
        </ScrollView>
      </FadeInView>
    </SafeAreaView>
  );
}

function RenameSnailRow({
  formError,
  onRenameSnail,
  snail
}: {
  formError: string;
  onRenameSnail: (snailId: string, name: string) => void;
  snail: Pick<StableSnailDetail, "id" | "name">;
}) {
  const [renameText, setRenameText] = useState(snail.name);
  const canSave = canSaveRename(renameText, snail.name);

  return (
    <View style={styles.renameRow}>
      <View style={styles.renameCopy}>
        <Text style={styles.renameLabel}>Custom name</Text>
        <TextInput
          accessibilityLabel={`Rename ${snail.name}`}
          maxLength={MAX_SNAIL_NAME_LENGTH}
          onChangeText={setRenameText}
          placeholder={snail.name}
          placeholderTextColor="#7d7a70"
          returnKeyType="done"
          style={styles.renameInput}
          value={renameText}
        />
        {formError ? (
          <Text numberOfLines={2} style={styles.renameError}>
            {formError}
          </Text>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Save name for ${snail.name}`}
        disabled={!canSave}
        onPress={() => onRenameSnail(snail.id, renameText)}
        style={({ pressed }) => [
          styles.renameButton,
          !canSave ? styles.renameButtonDisabled : null,
          pressed ? styles.renameButtonPressed : null
        ]}
      >
        <Text style={styles.renameButtonText}>Save</Text>
      </Pressable>
    </View>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailStat}>
      <Text numberOfLines={1} style={styles.detailStatLabel}>
        {label}
      </Text>
      <Text numberOfLines={2} style={styles.detailStatValue}>
        {value}
      </Text>
    </View>
  );
}

function formatOddsText(rarityPool: EggRarityPool): string {
  return getEggRarityPoolOdds(rarityPool)
    .map((odd) => `${Math.round(odd.probability * 100)}% ${odd.rarity}`)
    .join(" · ");
}

function formatPurchaseDetail(product: PurchaseCatalogProduct): string {
  if (product.grant.kind === "eggs") {
    return `${product.grant.count} eggs · ${formatOddsText(
      product.grant.rarityPool
    )}`;
  }

  if (product.grant.kind === "stable-slot") {
    return `${product.grant.count} empty stable slot`;
  }

  return product.description;
}

function formatLabel(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function canSaveRename(name: string, currentName: string): boolean {
  const trimmed = name.trim();

  return (
    trimmed.length > 0 &&
    trimmed.length <= MAX_SNAIL_NAME_LENGTH &&
    trimmed !== currentName
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    backgroundColor: "#f4f0e3",
    borderColor: "rgba(37, 51, 46, 0.16)",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 68,
    paddingHorizontal: 10
  },
  backButtonPressed: {
    backgroundColor: "#e6e0d1"
  },
  backButtonText: {
    color: "#25332e",
    fontSize: 13,
    fontWeight: "800"
  },
  buyButton: {
    alignItems: "center",
    backgroundColor: "#365c8d",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 60,
    paddingHorizontal: 10
  },
  buyButtonDisabled: {
    backgroundColor: "#7c8580"
  },
  buyButtonPressed: {
    backgroundColor: "#294870"
  },
  buyButtonText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "700"
  },
  capacity: {
    color: "#56645e",
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginLeft: 12,
    textAlign: "right"
  },
  content: {
    paddingBottom: 22,
    paddingHorizontal: 18,
    paddingTop: 20
  },
  detailCarrying: {
    backgroundColor: "#f8f6ed",
    borderColor: "rgba(63, 109, 91, 0.16)",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    padding: 12
  },
  detailCarryingText: {
    color: "#25332e",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19
  },
  detailHero: {
    alignItems: "center",
    backgroundColor: "#f8f6ed",
    borderColor: "rgba(63, 109, 91, 0.2)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginTop: 18,
    padding: 14
  },
  detailHeroCopy: {
    flex: 1,
    minWidth: 0
  },
  detailLore: {
    color: "#56645e",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8
  },
  detailSpriteFrame: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: "#edf1e8",
    borderColor: "rgba(63, 109, 91, 0.18)",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    maxWidth: 148,
    width: "38%"
  },
  detailStat: {
    backgroundColor: "#f8f6ed",
    borderColor: "rgba(43, 58, 52, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "48%",
    flexGrow: 1,
    minHeight: 72,
    paddingHorizontal: 11,
    paddingVertical: 10
  },
  detailStatLabel: {
    color: "#6d5a46",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  detailStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 14
  },
  detailStatValue: {
    color: "#25332e",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 19,
    marginTop: 6
  },
  detailStatus: {
    color: "#3f6d5b",
    fontSize: 13,
    fontWeight: "800"
  },
  detailTitle: {
    color: "#25332e",
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 31,
    marginTop: 4
  },
  detailTopBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  eggCopy: {
    flex: 1,
    minWidth: 0
  },
  eggList: {
    borderTopColor: "rgba(43, 58, 52, 0.12)",
    borderTopWidth: 1,
    gap: 8,
    marginTop: 14,
    paddingTop: 12
  },
  eggOdds: {
    color: "#56645e",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2
  },
  eggRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  eggTitle: {
    color: "#25332e",
    fontSize: 13,
    fontWeight: "700"
  },
  eyebrow: {
    color: "#6d5a46",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  hatchButton: {
    alignItems: "center",
    backgroundColor: "#365c8d",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 68,
    paddingHorizontal: 10
  },
  hatchButtonPressed: {
    backgroundColor: "#294870"
  },
  hatchButtonText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "700"
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  levelButton: {
    alignItems: "center",
    backgroundColor: "#3f6d5b",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 76,
    paddingHorizontal: 10
  },
  levelButtonDisabled: {
    backgroundColor: "#7c8580"
  },
  levelButtonPressed: {
    backgroundColor: "#315547"
  },
  levelButtonText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "700"
  },
  levelCopy: {
    flex: 1,
    minWidth: 0
  },
  levelRow: {
    alignItems: "center",
    borderTopColor: "rgba(43, 58, 52, 0.12)",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    paddingTop: 12
  },
  levelText: {
    color: "#25332e",
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    minWidth: 0
  },
  quietEggState: {
    backgroundColor: "#f8f6ed",
    borderColor: "rgba(63, 109, 91, 0.16)",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    padding: 12
  },
  quietEggText: {
    color: "#56645e",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4
  },
  quietEggTitle: {
    color: "#25332e",
    fontSize: 13,
    fontWeight: "800"
  },
  renameButton: {
    alignItems: "center",
    backgroundColor: "#3f6d5b",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 40,
    minWidth: 64,
    paddingHorizontal: 12
  },
  renameButtonDisabled: {
    backgroundColor: "#7c8580"
  },
  renameButtonPressed: {
    backgroundColor: "#315547"
  },
  renameButtonText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "800"
  },
  renameCopy: {
    flex: 1,
    minWidth: 0
  },
  renameError: {
    color: "#a13d2d",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 5
  },
  renameInput: {
    backgroundColor: "#fdfcf5",
    borderColor: "rgba(38, 51, 46, 0.18)",
    borderRadius: 8,
    borderWidth: 1,
    color: "#25332e",
    fontSize: 15,
    minHeight: 40,
    paddingHorizontal: 10
  },
  renameLabel: {
    color: "#6d5a46",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
    textTransform: "uppercase"
  },
  renameRow: {
    alignItems: "flex-end",
    borderTopColor: "rgba(43, 58, 52, 0.12)",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    paddingTop: 12
  },
  screen: {
    backgroundColor: "#edf1e8",
    flex: 1
  },
  shopCopy: {
    flex: 1,
    minWidth: 0
  },
  shopDetail: {
    color: "#56645e",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2
  },
  shopDisclosure: {
    color: "#6d5a46",
    fontSize: 12,
    lineHeight: 16
  },
  shopList: {
    borderTopColor: "rgba(43, 58, 52, 0.12)",
    borderTopWidth: 1,
    gap: 9,
    marginTop: 14,
    paddingTop: 12
  },
  shopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  shopTitle: {
    color: "#25332e",
    fontSize: 13,
    fontWeight: "700"
  },
  snailIdentityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  snailCopy: {
    flex: 1,
    minWidth: 0
  },
  snailItem: {
    backgroundColor: "#f8f6ed",
    borderColor: "rgba(63, 109, 91, 0.28)",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 9
  },
  snailItemBusy: {
    backgroundColor: "#e7ebe5",
    borderColor: "rgba(86, 100, 94, 0.2)"
  },
  snailItemPressed: {
    backgroundColor: "#e2eee5"
  },
  snailItemSelected: {
    borderColor: "#3f6d5b",
    borderWidth: 2
  },
  snailList: {
    gap: 9,
    marginTop: 16
  },
  snailMeta: {
    color: "#56645e",
    fontSize: 12,
    marginTop: 3
  },
  snailName: {
    color: "#25332e",
    flex: 1,
    fontSize: 15,
    fontWeight: "800"
  },
  snailStats: {
    color: "#6d5a46",
    fontSize: 12,
    marginTop: 3
  },
  snailStatus: {
    color: "#3f6d5b",
    fontSize: 12,
    fontWeight: "700"
  },
  snailRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  title: {
    color: "#25332e",
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
    marginTop: 3
  },
  titleBlock: {
    flex: 1,
    minWidth: 0
  }
});
