import { Text, View } from "react-native";

type DashboardHeaderProps = {
  title: string;
  subtitle: string;
};

export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  return (
    <View className="gap-3">
      <View className="self-start rounded-full border border-mint/20 bg-mint/10 px-3 py-1.5">
        <Text className="text-[11px] font-semibold uppercase tracking-[1.6px] text-mint">
          Loan Tracker
        </Text>
      </View>
      <View className="gap-1.5">
        <Text className="text-[40px] font-semibold leading-[46px] text-white">{title}</Text>
        <Text className="text-[15px] leading-6 text-muted">{subtitle}</Text>
      </View>
    </View>
  );
}
