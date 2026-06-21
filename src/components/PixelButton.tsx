import { type ReactNode, useState } from "react";
import {
  type GestureResponderEvent,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle
} from "react-native";

import { colors, radii, text } from "../theme";

// Chunky pixel button. A thick darker bottom border is the "3D base"; pressing
// translates the face down onto it (a physical key-press feel that works on both
// iOS and Android — no reliance on hard shadows, which Android can't render).
export type PixelButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "gold"
  | "neutral";

type PixelButtonProps = {
  accessibilityLabel?: string;
  disabled?: boolean;
  label: string;
  leading?: ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  size?: "default" | "compact";
  style?: StyleProp<ViewStyle>;
  variant?: PixelButtonVariant;
};

const FACE: Record<PixelButtonVariant, string> = {
  danger: colors.danger,
  gold: colors.accentGold,
  neutral: colors.surface,
  primary: colors.primary,
  secondary: colors.secondary
};

const BEVEL: Record<PixelButtonVariant, string> = {
  danger: colors.dangerBevel,
  gold: colors.accentGoldBevel,
  neutral: colors.disabledBevel,
  primary: colors.primaryBevel,
  secondary: colors.secondaryBevel
};

// gold + neutral faces are light, so their label is dark ink; the saturated
// faces take white.
const LABEL: Record<PixelButtonVariant, string> = {
  danger: colors.textOnAccent,
  gold: colors.textPrimary,
  neutral: colors.textPrimary,
  primary: colors.textOnAccent,
  secondary: colors.textOnAccent
};

export function PixelButton({
  accessibilityLabel,
  disabled = false,
  label,
  leading,
  onPress,
  size = "default",
  style,
  variant = "primary"
}: PixelButtonProps) {
  const [pressed, setPressed] = useState(false);
  const faceColor = disabled ? colors.disabledFill : FACE[variant];
  const bevelColor = disabled ? colors.disabledBevel : BEVEL[variant];
  const labelColor = disabled ? colors.textDisabled : LABEL[variant];
  const compact = size === "compact";

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={style}
    >
      <View
        style={[
          styles.face,
          compact ? styles.faceCompact : null,
          { backgroundColor: faceColor, borderBottomColor: bevelColor },
          pressed && !disabled ? styles.facePressed : null
        ]}
      >
        {leading}
        <Text
          numberOfLines={1}
          style={[
            compact ? styles.labelCompact : styles.label,
            { color: labelColor }
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  face: {
    alignItems: "center",
    borderBottomWidth: 5,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 16,
    paddingVertical: 9
  },
  faceCompact: {
    borderBottomWidth: 4,
    minHeight: 36,
    paddingHorizontal: 11,
    paddingVertical: 6
  },
  facePressed: {
    borderBottomWidth: 2,
    transform: [{ translateY: 3 }]
  },
  label: {
    ...text.pixelButton,
    textAlign: "center"
  },
  labelCompact: {
    ...text.pixelLabel,
    textAlign: "center"
  }
});
