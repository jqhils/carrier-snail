import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FadeInView } from "../components/FadeInView";
import { PixelButton } from "../components/PixelButton";
import { RarityBadge, SlimeChip, StatBar } from "../components/PixelUI";
import { SnailSprite } from "../components/SnailSprite";
import { colors, pixelShadow, radii, text } from "../theme";
import { getEggRarityPoolOdds, StableFullError } from "../useCases/hatchEgg";
import {
  getStableSnailDetail,
  type CarrierState,
  type Egg,
  type EggRarityPool,
  type Snail,
  type StableSnailDetail,
  type StableSnapshot
} from "../useCases/localCarrierState";
import type {
  PurchaseCatalogProduct,
  PurchaseProductId
} from "../useCases/purchaseInventory";
import { useSnailGameFlow } from "../minigames/SnailGameFlow";
import { expThresholdForLevel, levelUpCost } from "../useCases/levelUpSnail";
import { PURCHASE_FLOOR_DISCLOSURE } from "../useCases/purchaseInventory";
import { MAX_SNAIL_NAME_LENGTH } from "../useCases/renameSnail";
import { getSnailSpecies } from "../useCases/snailSpecies";
import { EmptyTabScreen } from "./EmptyTabScreen";

type MySnailsScreenProps = {
  slimeBalance: number;
  carrierState: CarrierState;
  formError: string;
  onBuyProduct: (productId: PurchaseProductId) => void;
  onHatchEgg: (eggId: string) => Promise<Snail | undefined>;
  onLevelSelectedSnail: () => void;
  onRenameSnail: (snailId: string, name: string) => void;
  onReleaseSnail: (snailId: string) => void;
  onSelectSnail: (snailId: string) => void;
  purchaseCatalog: PurchaseCatalogProduct[];
  readmeDetailSnailId?: string;
  selectedCanLevel: boolean;
  selectedSnailId: string;
  stable: StableSnapshot;
  unhatchedEggs: Egg[];
};

export function MySnailsScreen({
  carrierState,
  formError,
  onBuyProduct,
  onHatchEgg,
  onLevelSelectedSnail,
  onRenameSnail,
  onReleaseSnail,
  onSelectSnail,
  purchaseCatalog,
  readmeDetailSnailId,
  selectedCanLevel,
  selectedSnailId,
  slimeBalance,
  stable,
  unhatchedEggs
}: MySnailsScreenProps) {
  const [detailSnailId, setDetailSnailId] = useState<string | undefined>(
    readmeDetailSnailId
  );
  const [hatchingEggId, setHatchingEggId] = useState<string | undefined>();
  const [fullStablePromptVisible, setFullStablePromptVisible] = useState(false);
  const [shopVisible, setShopVisible] = useState(false);
  const slotPrice =
    purchaseCatalog.find((product) => product.id === "stable-slot-single")
      ?.slimePrice ?? 0;
  const gameFlow = useSnailGameFlow();

  function playSnailGames(snailId: string) {
    const snail = carrierState.snails.find((entry) => entry.id === snailId);
    if (snail) {
      gameFlow.open(snail);
    }
  }
  const [hatchReveal, setHatchReveal] = useState<
    { nonce: number; snail: Snail } | undefined
  >();
  const detail = detailSnailId
    ? getStableSnailDetail(carrierState, detailSnailId)
    : undefined;

  async function hatchEggWithReveal(eggId: string) {
    if (hatchingEggId) {
      return;
    }

    try {
      setHatchingEggId(eggId);
      const snail = await onHatchEgg(eggId);

      if (snail) {
        setFullStablePromptVisible(false);
        setHatchReveal((current) => ({
          nonce: (current?.nonce ?? 0) + 1,
          snail
        }));
      }
    } catch (error) {
      if (error instanceof StableFullError) {
        setFullStablePromptVisible(true);
      }
    } finally {
      setHatchingEggId(undefined);
    }
  }

  function openReleaseCandidate() {
    const candidate =
      stable.snails.find((snail) => snail.status === "resting") ??
      stable.snails[0];

    if (!candidate) {
      return;
    }

    onSelectSnail(candidate.id);
    setDetailSnailId(candidate.id);
    setFullStablePromptVisible(false);
  }

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

  if (shopVisible) {
    return (
      <ShopView
        onBack={() => setShopVisible(false)}
        onBuyProduct={onBuyProduct}
        purchaseCatalog={purchaseCatalog}
        slimeBalance={slimeBalance}
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
        onPlay={() => playSnailGames(detail.id)}
        onRenameSnail={onRenameSnail}
        onReleaseSnail={onReleaseSnail}
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
          <Text style={styles.eyebrow}>Stable</Text>
          <Text style={styles.title}>My Snails</Text>
          <Text style={styles.capacity}>
            {stable.capacity.freeCount} resting · {stable.capacity.busyCount} out ·{" "}
            {stable.capacity.freeSlots} of {stable.capacity.maxSlots} slots free
          </Text>
          <SlimeChip count={slimeBalance} style={styles.headerSlime} />
        </View>

        {fullStablePromptVisible ? (
          <View style={styles.fullStablePrompt}>
            <Text style={styles.fullStableTitle}>Stable full</Text>
            <Text style={styles.fullStableText}>
              Your stable is full — set a snail free, or add a slot.
            </Text>
            <View style={styles.fullStableActions}>
              <PixelButton
                accessibilityLabel="Choose a snail to set free"
                label="Set free"
                onPress={openReleaseCandidate}
                size="compact"
                variant="neutral"
              />
              <PixelButton
                accessibilityLabel="Buy a stable slot"
                disabled={slimeBalance < slotPrice}
                label="Add slot"
                onPress={() => {
                  setFullStablePromptVisible(false);
                  onBuyProduct("stable-slot-single");
                }}
                size="compact"
                variant="secondary"
              />
            </View>
          </View>
        ) : null}

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
                <PixelButton
                  accessibilityLabel={`Hatch ${egg.id}`}
                  disabled={!!hatchingEggId}
                  label={hatchingEggId === egg.id ? "Opening" : "Hatch"}
                  onPress={() => {
                    void hatchEggWithReveal(egg.id);
                  }}
                  size="compact"
                  variant="gold"
                />
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

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open the shop"
          onPress={() => setShopVisible(true)}
          style={({ pressed }) => [
            styles.shopEntry,
            pressed ? styles.shopEntryPressed : null
          ]}
        >
          <View style={styles.shopEntryBody}>
            <Text style={styles.shopEntryTitle}>Shop</Text>
            <Text style={styles.shopEntrySub}>
              Eggs, cosmetics + stable slots
            </Text>
          </View>
          <Text style={styles.shopEntryChevron}>›</Text>
        </Pressable>
      </ScrollView>
      {hatchReveal ? (
        <HatchRevealOverlay
          reveal={hatchReveal}
          onDismiss={() => setHatchReveal(undefined)}
        />
      ) : null}
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
  onPlay,
  onReleaseSnail,
  onRenameSnail
}: {
  canLevel: boolean;
  detail: StableSnailDetail;
  formError: string;
  levelCost: number;
  onBack: () => void;
  onLevelSelectedSnail: () => void;
  onPlay: () => void;
  onReleaseSnail: (snailId: string) => void;
  onRenameSnail: (snailId: string, name: string) => void;
}) {
  function confirmRelease() {
    Alert.alert(
      `Set ${detail.name} free?`,
      "They'll return to the garden, leaving a little slime behind. This can't be undone.",
      [
        {
          style: "cancel",
          text: "Keep"
        },
        {
          onPress: () => onReleaseSnail(detail.id),
          text: "Set free"
        }
      ]
    );
  }

  const expThreshold = expThresholdForLevel(detail.level);
  const expValue = Math.min(detail.experiencePoints, expThreshold);

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
              <Text numberOfLines={1} style={styles.levelExp}>
                Exp {expValue}/{expThreshold}
              </Text>
              <StatBar
                max={expThreshold}
                style={styles.levelBar}
                value={expValue}
              />
            </View>
            <PixelButton
              accessibilityLabel={`Level ${detail.name}`}
              disabled={!canLevel}
              label={`Level ${levelCost}`}
              onPress={onLevelSelectedSnail}
              size="compact"
            />
          </View>

          <View style={styles.detailPlayRow}>
            <PixelButton
              accessibilityLabel={`Play games as ${detail.name}`}
              label="Play games"
              onPress={onPlay}
              variant="secondary"
            />
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

          <View style={styles.releasePanel}>
            <View style={styles.releaseCopy}>
              <Text style={styles.renameLabel}>Set free</Text>
              <Text style={styles.releaseText}>
                Returns to the garden and leaves a little slime behind.
              </Text>
              {detail.status !== "resting" ? (
                <Text style={styles.releaseHint}>
                  Recall this snail home before setting it free.
                </Text>
              ) : null}
            </View>
            <PixelButton
              accessibilityLabel={`Set ${detail.name} free`}
              disabled={detail.status !== "resting"}
              label="Set free"
              onPress={confirmRelease}
              size="compact"
              variant="danger"
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
          placeholderTextColor={colors.textDisabled}
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
      <PixelButton
        accessibilityLabel={`Save name for ${snail.name}`}
        disabled={!canSave}
        label="Save"
        onPress={() => onRenameSnail(snail.id, renameText)}
        size="compact"
      />
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

function HatchRevealOverlay({
  onDismiss,
  reveal
}: {
  onDismiss: () => void;
  reveal: { nonce: number; snail: Snail };
}) {
  const [eggProgress] = useState(() => new Animated.Value(0));
  const [confettiProgress] = useState(() => new Animated.Value(0));
  const [snailProgress] = useState(() => new Animated.Value(0));
  const species = getSnailSpecies(reveal.snail.speciesId);
  const particles = useMemo(() => HATCH_CONFETTI_PARTICLES, []);

  useEffect(() => {
    eggProgress.setValue(0);
    confettiProgress.setValue(0);
    snailProgress.setValue(0);

    const animation = Animated.sequence([
      Animated.timing(eggProgress, {
        duration: 240,
        easing: Easing.out(Easing.quad),
        toValue: 1,
        useNativeDriver: false
      }),
      Animated.parallel([
        Animated.timing(confettiProgress, {
          duration: 720,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: false
        }),
        Animated.timing(snailProgress, {
          duration: 360,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: false
        })
      ])
    ]);

    animation.start();

    return () => animation.stop();
  }, [confettiProgress, eggProgress, reveal.nonce, snailProgress]);

  const eggScale = eggProgress.interpolate({
    inputRange: [0, 0.68, 1],
    outputRange: [0.92, 1.16, 0.74]
  });
  const eggOpacity = eggProgress.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [1, 1, 0]
  });
  const snailScale = snailProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1]
  });
  const panelScale = snailProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1]
  });

  return (
    <View pointerEvents="box-none" style={styles.hatchRevealOverlay}>
      <Animated.View
        style={[
          styles.hatchRevealPanel,
          {
            transform: [{ scale: panelScale }]
          }
        ]}
      >
        <View pointerEvents="none" style={styles.hatchConfettiLayer}>
          {particles.map((particle) => (
            <Animated.View
              key={particle.id}
              style={[
                styles.hatchConfettiPiece,
                {
                  backgroundColor: particle.color,
                  opacity: confettiProgress.interpolate({
                    inputRange: [0, 0.12, 1],
                    outputRange: [0, 1, 0]
                  }),
                  transform: [
                    {
                      translateX: confettiProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, particle.x]
                      })
                    },
                    {
                      translateY: confettiProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, particle.y]
                      })
                    },
                    {
                      rotate: confettiProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", `${particle.rotate}deg`]
                      })
                    }
                  ]
                }
              ]}
            />
          ))}
        </View>

        <View style={styles.hatchStage}>
          <Animated.View
            style={[
              styles.hatchEggShell,
              {
                opacity: eggOpacity,
                transform: [{ scale: eggScale }]
              }
            ]}
          >
            <View style={styles.hatchEggCrack} />
            <View style={styles.hatchEggCrackSecond} />
          </Animated.View>
          <Animated.View
            testID="hatch-reveal-sprite-frame"
            style={[
              styles.hatchSnailReveal,
              {
                transform: [{ scale: snailScale }]
              }
            ]}
          >
            <SnailSprite speciesId={reveal.snail.speciesId} size={118} />
          </Animated.View>
        </View>

        <RarityBadge rarity={reveal.snail.rarity} style={styles.hatchRevealBadge} />
        <Text numberOfLines={2} style={styles.hatchRevealName}>
          {reveal.snail.name}
        </Text>
        <Text numberOfLines={2} style={styles.hatchRevealDetail}>
          {species.displayName} joined the stable
        </Text>

        <View style={styles.hatchRevealAction}>
          <PixelButton
            accessibilityLabel={`Dismiss hatch reveal for ${reveal.snail.name}`}
            label="Done"
            onPress={onDismiss}
          />
        </View>
      </Animated.View>
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

const HATCH_CONFETTI_PARTICLES = [
  { color: colors.accentGold, id: "a", rotate: 42, x: -112, y: -102 },
  { color: colors.secondary, id: "b", rotate: -68, x: 96, y: -118 },
  { color: colors.accentPink, id: "c", rotate: 92, x: -74, y: -64 },
  { color: colors.primary, id: "d", rotate: -36, x: 118, y: -52 },
  { color: colors.accentLime, id: "e", rotate: 128, x: -122, y: 18 },
  { color: colors.accentWarm, id: "f", rotate: -104, x: 104, y: 28 },
  { color: colors.accentGold, id: "g", rotate: 58, x: -34, y: -132 },
  { color: colors.accentPink, id: "h", rotate: -146, x: 38, y: -138 }
];

function shopIcon(product: PurchaseCatalogProduct): string {
  if (product.grant.kind === "eggs") {
    return "🥚";
  }
  if (product.grant.kind === "stable-slot") {
    return "🐚";
  }
  return "✨";
}

function ShopView({
  onBack,
  onBuyProduct,
  purchaseCatalog,
  slimeBalance
}: {
  onBack: () => void;
  onBuyProduct: (productId: PurchaseProductId) => void;
  purchaseCatalog: PurchaseCatalogProduct[];
  slimeBalance: number;
}) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      <FadeInView>
        <ScrollView
          contentContainerStyle={styles.content}
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
            <SlimeChip count={slimeBalance} />
          </View>

          <View style={styles.shopHeader}>
            <Text style={styles.shopEyebrow}>Carrier Shop</Text>
            <Text style={styles.shopHeading}>Shop</Text>
            <Text style={styles.shopSubtitle}>
              Spend the slime you earn from deliveries and games.
            </Text>
          </View>

          <View style={styles.shopCards}>
            {purchaseCatalog.map((product) => {
              const affordable = slimeBalance >= product.slimePrice;
              return (
                <View key={product.id} style={styles.shopCard}>
                  <View style={styles.shopCardIcon}>
                    <Text style={styles.shopCardIconText}>
                      {shopIcon(product)}
                    </Text>
                  </View>
                  <View style={styles.shopCardBody}>
                    <Text numberOfLines={1} style={styles.shopCardTitle}>
                      {product.label}
                    </Text>
                    <Text numberOfLines={2} style={styles.shopCardDetail}>
                      {formatPurchaseDetail(product)}
                    </Text>
                  </View>
                  <PixelButton
                    accessibilityLabel={`Buy ${product.label} for ${product.slimePrice} slime`}
                    disabled={!affordable}
                    label={`${product.slimePrice} slime`}
                    onPress={() => onBuyProduct(product.id)}
                    size="compact"
                    variant="secondary"
                  />
                </View>
              );
            })}
          </View>

          <Text style={styles.shopDisclosure}>{PURCHASE_FLOOR_DISCLOSURE}</Text>
        </ScrollView>
      </FadeInView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 2,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 68,
    paddingHorizontal: 10
  },
  backButtonPressed: {
    backgroundColor: colors.backgroundSunken
  },
  backButtonText: {
    ...text.pixelLabel,
    color: colors.textPrimary
  },
  capacity: {
    ...text.bodySm,
    color: colors.textMuted,
    marginTop: 2
  },
  content: {
    paddingBottom: 22,
    paddingHorizontal: 18,
    paddingTop: 20
  },
  detailCarrying: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
    marginTop: 14,
    padding: 12
  },
  detailCarryingText: {
    ...text.bodyStrong,
    color: colors.textPrimary
  },
  detailHero: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 2,
    flexDirection: "row",
    gap: 14,
    marginTop: 18,
    padding: 14,
    ...pixelShadow
  },
  detailHeroCopy: {
    flex: 1,
    minWidth: 0
  },
  detailLore: {
    ...text.body,
    color: colors.textMuted,
    marginTop: 8
  },
  detailPlayRow: {
    marginTop: 10
  },
  detailSpriteFrame: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: colors.backgroundSunken,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
    justifyContent: "center",
    maxWidth: 148,
    width: "38%"
  },
  detailStat: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
    flexBasis: "48%",
    flexGrow: 1,
    minHeight: 72,
    paddingHorizontal: 11,
    paddingVertical: 10
  },
  detailStatLabel: {
    ...text.pixelMicro,
    color: colors.accentWarm,
    textTransform: "uppercase"
  },
  detailStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 14
  },
  detailStatus: {
    ...text.pixelLabel,
    color: colors.primary
  },
  detailStatValue: {
    ...text.bodyStrong,
    color: colors.textPrimary,
    marginTop: 6
  },
  detailTitle: {
    ...text.bodyStrongLg,
    color: colors.textPrimary,
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
    borderTopColor: colors.borderHairline,
    borderTopWidth: 1,
    gap: 8,
    marginTop: 22,
    paddingTop: 16
  },
  eggOdds: {
    ...text.bodySm,
    color: colors.textMuted,
    marginTop: 2
  },
  eggRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  eggTitle: {
    ...text.bodyStrong,
    color: colors.textPrimary
  },
  eyebrow: {
    ...text.pixelLabel,
    color: colors.accentWarm,
    textTransform: "uppercase"
  },
  fullStableActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12
  },
  fullStablePrompt: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
    marginBottom: 14,
    padding: 12
  },
  fullStableText: {
    ...text.body,
    color: colors.textMuted,
    marginTop: 4
  },
  fullStableTitle: {
    ...text.pixelHeading,
    color: colors.textPrimary
  },
  hatchConfettiLayer: {
    bottom: 0,
    left: 0,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    top: 0
  },
  hatchConfettiPiece: {
    borderRadius: 2,
    height: 8,
    left: "50%",
    position: "absolute",
    top: 112,
    width: 5
  },
  hatchEggCrack: {
    backgroundColor: colors.accentGoldBevel,
    borderRadius: 1,
    height: 32,
    left: 45,
    opacity: 0.68,
    position: "absolute",
    top: 22,
    transform: [{ rotate: "18deg" }],
    width: 3
  },
  hatchEggCrackSecond: {
    backgroundColor: colors.accentGoldBevel,
    borderRadius: 1,
    height: 26,
    left: 57,
    opacity: 0.58,
    position: "absolute",
    top: 49,
    transform: [{ rotate: "-28deg" }],
    width: 3
  },
  hatchEggShell: {
    backgroundColor: colors.accentGold,
    borderColor: colors.border,
    borderRadius: 50,
    borderWidth: 2,
    height: 104,
    position: "absolute",
    width: 84
  },
  hatchRevealAction: {
    alignSelf: "center",
    marginTop: 18
  },
  hatchRevealBadge: {
    alignSelf: "center",
    marginTop: 6
  },
  hatchRevealDetail: {
    ...text.body,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: "center"
  },
  hatchRevealName: {
    ...text.bodyStrongLg,
    color: colors.textPrimary,
    marginTop: 8,
    textAlign: "center"
  },
  hatchRevealOverlay: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    padding: 18,
    position: "absolute",
    right: 0,
    top: 0
  },
  hatchRevealPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 2,
    overflow: "hidden",
    paddingBottom: 18,
    paddingHorizontal: 18,
    paddingTop: 16,
    width: "100%",
    ...pixelShadow
  },
  hatchSnailReveal: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute"
  },
  hatchStage: {
    alignItems: "center",
    height: 140,
    justifyContent: "center"
  },
  header: {
    gap: 3
  },
  headerSlime: {
    alignSelf: "flex-start",
    marginTop: 8
  },
  levelBar: {
    marginTop: 8
  },
  levelCopy: {
    flex: 1,
    minWidth: 0
  },
  levelExp: {
    ...text.bodySm,
    color: colors.textMuted,
    marginTop: 2
  },
  levelRow: {
    alignItems: "center",
    borderTopColor: colors.borderHairline,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    paddingTop: 12
  },
  levelText: {
    ...text.bodyStrong,
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0
  },
  quietEggState: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
    marginTop: 22,
    padding: 14
  },
  quietEggText: {
    ...text.bodySm,
    color: colors.textMuted,
    marginTop: 4
  },
  quietEggTitle: {
    ...text.pixelLabel,
    color: colors.textPrimary
  },
  releaseCopy: {
    flex: 1,
    minWidth: 0
  },
  releaseHint: {
    ...text.bodySm,
    color: colors.accentWarm,
    marginTop: 4
  },
  releasePanel: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
    padding: 12
  },
  releaseText: {
    ...text.body,
    color: colors.textMuted,
    marginTop: 4
  },
  renameCopy: {
    flex: 1,
    minWidth: 0
  },
  renameError: {
    ...text.bodySm,
    color: colors.danger,
    marginTop: 5
  },
  renameInput: {
    ...text.body,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 2,
    color: colors.textPrimary,
    minHeight: 40,
    paddingHorizontal: 10
  },
  renameLabel: {
    ...text.pixelLabel,
    color: colors.accentWarm,
    marginBottom: 6,
    textTransform: "uppercase"
  },
  renameRow: {
    alignItems: "flex-end",
    borderTopColor: colors.borderHairline,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    paddingTop: 12
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  shopCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 2,
    flexDirection: "row",
    gap: 12,
    padding: 14
  },
  shopCardBody: {
    flex: 1,
    gap: 3,
    minWidth: 0
  },
  shopCardDetail: {
    ...text.bodySm,
    color: colors.textMuted
  },
  shopCardIcon: {
    alignItems: "center",
    backgroundColor: colors.accentLimeSoft,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
    height: 46,
    justifyContent: "center",
    width: 46
  },
  shopCardIconText: {
    fontSize: 24
  },
  shopCards: {
    gap: 12,
    marginTop: 18
  },
  shopCardTitle: {
    ...text.bodyStrongLg,
    color: colors.textPrimary
  },
  shopDisclosure: {
    ...text.bodySm,
    color: colors.textMuted,
    marginTop: 18
  },
  shopEntry: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    ...pixelShadow
  },
  shopEntryBody: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  shopEntryChevron: {
    ...text.pixelHeading,
    color: colors.textOnAccent
  },
  shopEntryPressed: {
    backgroundColor: colors.primaryPressed
  },
  shopEntrySub: {
    ...text.body,
    color: colors.textOnAccent
  },
  shopEntryTitle: {
    ...text.pixelHeading,
    color: colors.textOnAccent
  },
  shopEyebrow: {
    ...text.pixelLabel,
    color: colors.accentWarm,
    textTransform: "uppercase"
  },
  shopHeader: {
    gap: 6,
    marginTop: 16
  },
  shopHeading: {
    ...text.pixelTitle,
    color: colors.textPrimary
  },
  shopSubtitle: {
    ...text.body,
    color: colors.textMuted
  },
  snailCopy: {
    flex: 1,
    minWidth: 0
  },
  snailIdentityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  snailItem: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
    paddingHorizontal: 11,
    paddingVertical: 9
  },
  snailItemBusy: {
    backgroundColor: colors.backgroundSunken
  },
  snailItemPressed: {
    backgroundColor: colors.surfaceSelected
  },
  snailItemSelected: {
    backgroundColor: colors.surfaceSelected,
    borderColor: colors.primary
  },
  snailList: {
    gap: 9,
    marginTop: 22
  },
  snailMeta: {
    ...text.bodySm,
    color: colors.textMuted,
    marginTop: 3
  },
  snailName: {
    ...text.bodyStrong,
    color: colors.textPrimary,
    flex: 1
  },
  snailRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  snailStats: {
    ...text.bodyXs,
    color: colors.textMuted,
    marginTop: 3
  },
  snailStatus: {
    ...text.bodyStrongSm,
    color: colors.primary
  },
  title: {
    ...text.pixelTitle,
    color: colors.textPrimary,
    marginTop: 3
  }
});
