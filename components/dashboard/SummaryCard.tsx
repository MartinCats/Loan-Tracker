import { Text, View } from "react-native";

type SummaryCardProps = {
  label: string;
  value: string;
  accent: "mint" | "gold" | "cyan";
};

const accentClassNames: Record<SummaryCardProps["accent"], string> = {
  mint: "border-mint/20 bg-mint/10 shadow-mint/5",
  gold: "border-gold/20 bg-gold/10 shadow-gold/5",
  cyan: "border-cyan/20 bg-cyan/10 shadow-cyan/5"
};

const dotClassNames: Record<SummaryCardProps["accent"], string> = {
  mint: "bg-mint",
  gold: "bg-gold",
  cyan: "bg-cyan",
};

export function SummaryCard({ label, value, accent }: SummaryCardProps) {
  return (
    <View
      className={`min-h-[108px] flex-1 overflow-hidden rounded-[22px] border bg-surface/90 px-4 py-4 shadow-lg ${accentClassNames[accent]}`}
    >
      <View className={`absolute right-0 top-0 h-0.5 w-full ${dotClassNames[accent]} opacity-55`} />
      <View className="gap-3">
        <View className={`h-2 w-2 rounded-full ${dotClassNames[accent]}`} />
        <View className="gap-1.5">
          <Text className="text-[12px] font-medium uppercase tracking-[0.8px] text-muted">
            {label}
          </Text>
          <Text className="text-[24px] font-semibold leading-[30px] text-white">{value}</Text>
        </View>
      </View>
    </View>
  );
}
