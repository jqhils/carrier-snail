import { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  type ImageStyle,
  type ImageSourcePropType,
  type StyleProp,
  StyleSheet
} from "react-native";

import {
  getSnailSpecies,
  type SnailSpeciesId
} from "../useCases/snailSpecies";

declare const require: (id: string) => ImageSourcePropType;

export const SNAIL_SPRITE_ASSETS = {
  "absent-father": require("../../assets/snails/absent-father.png"),
  backwards: require("../../assets/snails/backwards.png"),
  barista: require("../../assets/snails/barista.png"),
  "comp-sci": require("../../assets/snails/comp-sci.png"),
  garden: require("../../assets/snails/garden.png"),
  golden: require("../../assets/snails/golden.png"),
  postal: require("../../assets/snails/postal.png"),
  "red-bull": require("../../assets/snails/red-bull.png"),
  "sydney-train": require("../../assets/snails/sydney-train.png"),
  "uni-sydney": require("../../assets/snails/uni-sydney.png")
} satisfies Record<SnailSpeciesId, ImageSourcePropType>;

export type SnailSpriteProps = {
  accessibilityLabel?: string;
  size: number;
  speciesId: SnailSpeciesId;
  style?: StyleProp<ImageStyle>;
  walking?: boolean;
};

export function SnailSprite({
  accessibilityLabel,
  size,
  speciesId,
  style,
  walking = false
}: SnailSpriteProps) {
  const [walkProgress] = useState(() => new Animated.Value(0));
  const species = getSnailSpecies(speciesId);

  useEffect(() => {
    if (!walking) {
      walkProgress.stopAnimation();
      walkProgress.setValue(0);
      return undefined;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(walkProgress, {
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          toValue: 1,
          useNativeDriver: true
        }),
        Animated.timing(walkProgress, {
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          toValue: 0,
          useNativeDriver: true
        })
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [walkProgress, walking]);

  const bob = walkProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -size * 0.045, 0]
  });
  const glide = walkProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-size * 0.018, size * 0.018, -size * 0.018]
  });
  const squash = walkProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.965, 1]
  });
  const stretch = walkProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.025, 1]
  });

  return (
    <Animated.Image
      accessibilityLabel={accessibilityLabel ?? species.displayName}
      accessibilityRole="image"
      resizeMode="contain"
      source={SNAIL_SPRITE_ASSETS[speciesId]}
      style={[
        styles.sprite,
        {
          height: size,
          transform: [
            { translateX: glide },
            { translateY: bob },
            { scaleX: stretch },
            { scaleY: squash }
          ],
          width: size
        },
        style
      ]}
    />
  );
}

const styles = StyleSheet.create({
  sprite: {
    flexShrink: 0
  }
});
