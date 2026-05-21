import { Text, View } from "react-native";

type OverviewTone = "neutral" | "mint" | "gold" | "danger" | "cyan";

type OverviewRow = {
  label: string;
  value: string;
  tone?: OverviewTone;
};

type LoanOverviewCardProps = {
  title: string;
  rows: OverviewRow[];
};

const toneClassNames: Record<OverviewTone, string> = {
  neutral: "text-white",
  mint: "text-mint",
  gold: "text-gold",
  danger: "text-danger",
  cyan: "text-cyan"
};

export function LoanOverviewCard({ title, rows }: LoanOverviewCardProps) {
  return (
    <View className="rounded-[24px] border border-borderSoft bg-surface/90 p-5 shadow-lg shadow-black/20">
      <Text className="text-[20px] font-semibold text-white">{title}</Text>

      <View className="mt-5 gap-4">
        {rows.map((row) => (
          <View
            key={row.label}
            className="flex-row items-center justify-between border-b border-white/5 pb-4 last:border-b-0 last:pb-0"
          >
            <Text className="text-[14px] text-muted">{row.label}</Text>
            <Text className={`text-[16px] font-semibold ${toneClassNames[row.tone ?? "neutral"]}`}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
