import { Text, View } from "react-native";

type SummaryCardProps = {
  label: string;
  value: string;
  accent: "mint" | "gold" | "cyan";
  emphasis?: "primary" | "secondary" | "quiet";
};

const accentClassNames: Record<SummaryCardProps["accent"], Record<NonNullable<SummaryCardProps["emphasis"]>, string>> = {
  mint: {
    primary: "border-mint/25 bg-mint/10 shadow-mint/10",
    secondary: "border-mint/20 bg-mint/10 shadow-mint/5",
    quiet: "border-mint/10 bg-mint/5 shadow-mint/5"
  },
  gold: {
    primary: "border-gold/25 bg-gold/10 shadow-gold/10",
    secondary: "border-gold/20 bg-gold/10 shadow-gold/5",
    quiet: "border-gold/10 bg-gold/5 shadow-gold/5"
  },
  cyan: {
    primary: "border-cyan/25 bg-cyan/10 shadow-cyan/10",
    secondary: "border-cyan/20 bg-cyan/10 shadow-cyan/5",
    quiet: "border-cyan/10 bg-cyan/5 shadow-cyan/5"
  }
};

const dotClassNames: Record<SummaryCardProps["accent"], string> = {
  mint: "bg-mint",
  gold: "bg-gold",
  cyan: "bg-cyan",
};

const emphasisClassNames: Record<NonNullable<SummaryCardProps["emphasis"]>, string> = {
  primary: "min-h-[122px] px-5 py-5",
  secondary: "min-h-[112px] px-4 py-4",
  quiet: "min-h-[104px] px-4 py-4"
};

const valueClassNames: Record<NonNullable<SummaryCardProps["emphasis"]>, string> = {
  primary: "text-[32px] leading-9",
  secondary: "text-[22px] leading-7",
  quiet: "text-[21px] leading-7"
};

export function SummaryCard({ label, value, accent, emphasis = "secondary" }: SummaryCardProps) {
  return (
    <View
      className={`flex-1 overflow-hidden rounded-[24px] border bg-surface/90 shadow-lg ${emphasisClassNames[emphasis]} ${accentClassNames[accent][emphasis]}`}
    >
      <View className={`absolute left-5 right-5 top-0 h-0.5 ${dotClassNames[accent]} opacity-45`} />
      <View className="gap-4">
        <View className={`h-2 w-2 rounded-full ${dotClassNames[accent]}`} />
        <View className="gap-1">
          <Text className="text-[12px] font-medium text-muted">{label}</Text>
          <Text className={`font-semibold text-white ${valueClassNames[emphasis]}`}>{value}</Text>
        </View>
      </View>
    </View>
  );
}
