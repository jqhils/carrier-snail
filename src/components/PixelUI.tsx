import {
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle
} from "react-native";

import { colors, radii, text } from "../theme";

// Pixel UI accents shared across screens: a slime-currency chip, a rarity badge,
// a stat/EXP bar, and an outlined hero title.

export function SlimeChip({
  count,
  style
}: {
  count: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.slimeChip, style]}>
      <View style={styles.slimeBlob} />
      <Text style={styles.slimeText}>{count}</Text>
    </View>
  );
}

const RARITY_COLOR: Record<string, string> = {
  common: colors.rarityCommon,
  cursed: colors.rarityCursed,
  epic: colors.rarityCursed,
  legendary: colors.rarityMythic,
  mythic: colors.rarityMythic,
  rare: colors.rarityRare,
  uncommon: colors.rarityUncommon
};

export function RarityBadge({
  rarity,
  style
}: {
  rarity: string;
  style?: StyleProp<ViewStyle>;
}) {
  const tint = RARITY_COLOR[rarity.toLowerCase()] ?? colors.rarityCommon;

  return (
    <View style={[styles.rarityBadge, { backgroundColor: tint }, style]}>
      <Text style={styles.rarityText}>{rarity.toUpperCase()}</Text>
    </View>
  );
}

export function StatBar({
  color = colors.accentLime,
  max,
  style,
  value
}: {
  color?: string;
  max: number;
  style?: StyleProp<ViewStyle>;
  value: number;
}) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;

  return (
    <View style={[styles.statTrack, style]}>
      <View
        style={[
          styles.statFill,
          { backgroundColor: color, width: `${ratio * 100}%` }
        ]}
      />
    </View>
  );
}

// Stacks 8 offset copies behind the fill to fake a 2px text stroke — the
// MapleStory-style outlined title. Use sparingly (heroes/CTAs), never body.
const OUTLINE_OFFSETS: [number, number][] = [
  [-2, 0],
  [2, 0],
  [0, -2],
  [0, 2],
  [-2, -2],
  [2, -2],
  [-2, 2],
  [2, 2]
];

export function OutlinedTitle({
  children,
  fill = colors.textOnAccent,
  fontStyle = text.pixelTitle,
  outline = colors.border,
  style
}: {
  children: string;
  fill?: string;
  fontStyle?: TextStyle;
  outline?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.outlineWrap, style]}>
      {OUTLINE_OFFSETS.map(([dx, dy]) => (
        <Text
          key={`outline-${dx}-${dy}`}
          style={[
            fontStyle,
            styles.outlineLayer,
            { color: outline, transform: [{ translateX: dx }, { translateY: dy }] }
          ]}
        >
          {children}
        </Text>
      ))}
      <Text style={[fontStyle, { color: fill }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  outlineLayer: {
    left: 0,
    position: "absolute",
    top: 0
  },
  outlineWrap: {
    alignSelf: "flex-start",
    position: "relative"
  },
  rarityBadge: {
    alignSelf: "flex-start",
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 2,
    paddingHorizontal: 7,
    paddingVertical: 3
  },
  rarityText: {
    ...text.pixelMicro,
    color: colors.textPrimary
  },
  slimeBlob: {
    backgroundColor: colors.accentLime,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 2,
    height: 15,
    width: 15
  },
  slimeChip: {
    alignItems: "center",
    backgroundColor: colors.accentLimeSoft,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 2,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  slimeText: {
    ...text.pixelMicro,
    color: colors.textPrimary
  },
  statFill: {
    borderRadius: radii.pill,
    height: "100%"
  },
  statTrack: {
    backgroundColor: colors.backgroundSunken,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 12,
    overflow: "hidden"
  }
});
