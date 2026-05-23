import { Text } from "react-native";

import { PressableScale } from "@/components/ui/PressableScale";
import { impactLight } from "@/utils/haptics";

type LoanFilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function LoanFilterChip({ label, selected, onPress }: LoanFilterChipProps) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        impactLight();
        onPress();
      }}
      className={`rounded-full border px-4 py-2.5 ${
        selected ? "border-mint bg-mint" : "border-white/10 bg-white/5"
      }`}
      scaleTo={0.96}
    >
      <Text className={`text-[13px] font-semibold ${selected ? "text-background" : "text-muted"}`}>
        {label}
      </Text>
    </PressableScale>
  );
}
