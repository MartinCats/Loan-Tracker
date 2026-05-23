import { Pressable, Text } from "react-native";

type LoanFilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function LoanFilterChip({ label, selected, onPress }: LoanFilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`rounded-full border px-4 py-2.5 ${
        selected ? "border-mint bg-mint" : "border-white/10 bg-white/5"
      }`}
    >
      <Text className={`text-[13px] font-semibold ${selected ? "text-background" : "text-muted"}`}>
        {label}
      </Text>
    </Pressable>
  );
}
