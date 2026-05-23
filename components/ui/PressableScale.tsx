import type { ReactNode } from "react";
import type { PressableProps, ViewStyle } from "react-native";
import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";

type PressableScaleProps = PressableProps & {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  scaleTo?: number;
};

export function PressableScale({
  children,
  className,
  contentClassName,
  disabled,
  onPressIn,
  onPressOut,
  scaleTo = 0.985,
  ...props
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle<ViewStyle>(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Pressable
      {...props}
      className={className}
      disabled={disabled}
      onPressIn={(event) => {
        if (!disabled) {
          scale.value = withTiming(scaleTo, { duration: 90 });
        }

        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withTiming(1, { duration: 120 });
        onPressOut?.(event);
      }}
    >
      <Animated.View className={contentClassName} style={animatedStyle}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
