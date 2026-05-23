import { Text, View } from "react-native";

import { t } from "@/services/i18n";

type Urgency = "overdue" | "today" | "soon" | "upcoming";

type LoanFocusCardProps = {
  borrowerName: string;
  amountDue: string;
  amountLabel?: string;
  countdownValue: string;
  countdownLabel: string;
  countdownAccessibilityLabel: string;
  dueDate: string;
  paymentCycle: string;
  urgency: Urgency;
};

const urgencyStyles: Record<Urgency, { shell: string; rail: string; pill: string; text: string; amount: string }> = {
  overdue: {
    shell: "border-danger/20 bg-danger/10 shadow-danger/10",
    rail: "bg-danger",
    pill: "border border-danger/20 bg-danger/10",
    text: "text-danger",
    amount: "text-white"
  },
  today: {
    shell: "border-gold/20 bg-gold/10 shadow-gold/5",
    rail: "bg-gold",
    pill: "border border-gold/20 bg-gold/10",
    text: "text-gold",
    amount: "text-white"
  },
  soon: {
    shell: "border-mint/10 bg-mint/10 shadow-mint/5",
    rail: "bg-mint",
    pill: "border border-mint/10 bg-mint/10",
    text: "text-mint",
    amount: "text-white"
  },
  upcoming: {
    shell: "border-cyan/10 bg-cyan/5 shadow-cyan/5",
    rail: "bg-cyan",
    pill: "border border-cyan/10 bg-cyan/5",
    text: "text-cyan",
    amount: "text-white"
  }
};

export function LoanFocusCard({
  borrowerName,
  amountDue,
  amountLabel = "Amount due",
  countdownValue,
  countdownLabel,
  countdownAccessibilityLabel,
  dueDate,
  paymentCycle,
  urgency
}: LoanFocusCardProps) {
  const styles = urgencyStyles[urgency];

  return (
    <View className={`overflow-hidden rounded-[24px] border bg-surface/90 p-5 shadow-lg ${styles.shell}`}>
      <View className={`absolute left-0 top-5 h-16 w-0.5 rounded-full ${styles.rail} opacity-45`} />
      <View className={`absolute left-0 right-0 top-0 h-10 ${styles.rail} opacity-5`} />
      <View className="flex-row items-start gap-4">
        <View className="min-w-0 flex-1 gap-1">
          <Text numberOfLines={1} className="text-[18px] font-semibold leading-6 text-white">
            {borrowerName}
          </Text>
          <Text className="text-[13px] text-mutedSoft">{paymentCycle}</Text>
        </View>
        <View
          accessibilityLabel={countdownAccessibilityLabel}
          className={`min-h-[74px] min-w-[78px] items-center justify-center rounded-[22px] px-3 py-3 ${styles.pill}`}
        >
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            className={`text-center text-[22px] font-semibold leading-7 ${styles.text}`}
          >
            {countdownValue}
          </Text>
          <Text
            numberOfLines={2}
            className={`mt-0.5 text-center text-[10px] font-semibold uppercase leading-3 ${styles.text} opacity-75`}
          >
            {countdownLabel}
          </Text>
        </View>
      </View>

      <View className="mt-6 gap-1.5">
        <Text className="text-[12px] font-medium text-muted">{amountLabel}</Text>
        <Text className={`text-[34px] font-semibold leading-[40px] ${styles.amount}`}>
          {amountDue}
        </Text>
      </View>

      <View className="mt-5 flex-row items-center justify-between border-t border-white/10 pt-4">
        <Text className="text-[13px] text-mutedSoft">{t("common.dueDate")}</Text>
        <Text className="text-[15px] font-medium text-white">{dueDate}</Text>
      </View>
    </View>
  );
}
