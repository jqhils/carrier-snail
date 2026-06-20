import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, type ViewProps } from "react-native";

type FadeInViewProps = ViewProps & {
  /** Animation duration in ms. */
  durationMs?: number;
  /** How far (px) the content rises as it fades in. */
  rise?: number;
};

/**
 * A calm fade + rise when content mounts, used on tab change. Core React Native
 * Animated with the native driver (no Reanimated / worklets), so it is safe on
 * the new architecture and runs off the JS thread. Ease-out, short, no bounce.
 */
export function FadeInView({
  children,
  durationMs = 190,
  rise = 8,
  style,
  ...rest
}: FadeInViewProps) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.timing(progress, {
      duration: durationMs,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true
    });
    animation.start();

    return () => animation.stop();
  }, [durationMs, progress]);

  return (
    <Animated.View
      {...rest}
      style={[
        styles.fill,
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [rise, 0]
              })
            }
          ]
        }
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1
  }
});
