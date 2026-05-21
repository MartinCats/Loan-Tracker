import { Text, View } from "react-native";

type Urgency = "overdue" | "today" | "soon";

type LoanFocusCardProps = {
  borrowerName: string;
  amountDue: string;
  countdownText: string;
  dueDate: string;
  paymentCycle: string;
  urgency: Urgency;
};

const urgencyStyles: Record<Urgency, { shell: string; rail: string; pill: string; text: string }> = {
  overdue: {
    shell: "border-danger/20 bg-danger/10 shadow-danger/10",
    rail: "bg-danger",
    pill: "border border-danger/20 bg-danger/10",
    text: "text-danger"
  },
  today: {
    shell: "border-gold/25 bg-gold/10 shadow-gold/10",
    rail: "bg-gold",
    pill: "border border-gold/20 bg-gold/10",
    text: "text-gold"
  },
  soon: {
    shell: "border-mint/20 bg-mint/10 shadow-mint/5",
    rail: "bg-mint",
    pill: "border border-mint/20 bg-mint/10",
    text: "text-mint"
  }
};

export function LoanFocusCard({
  borrowerName,
  amountDue,
  countdownText,
  dueDate,
  paymentCycle,
  urgency
}: LoanFocusCardProps) {
  const styles = urgencyStyles[urgency];

  return (
    <View className={`overflow-hidden rounded-[24px] border bg-surface/90 p-5 shadow-lg ${styles.shell}`}>
      <View className={`absolute left-0 top-0 h-full w-1 ${styles.rail} opacity-35`} />
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-[18px] font-semibold leading-6 text-white">{borrowerName}</Text>
          <Text className="text-[13px] text-muted">{paymentCycle}</Text>
        </View>
        <View className={`rounded-full px-3 py-1 ${styles.pill}`}>
          <Text className={`text-[12px] font-semibold ${styles.text}`}>{countdownText}</Text>
        </View>
      </View>

      <View className="mt-6 gap-1.5">
        <Text className="text-[12px] font-medium uppercase tracking-[0.8px] text-muted">
          Amount due
        </Text>
        <Text className="text-[34px] font-semibold leading-[40px] text-white">{amountDue}</Text>
      </View>

      <View className="mt-5 flex-row items-center justify-between border-t border-white/10 pt-4">
        <Text className="text-[13px] text-muted">Due date</Text>
        <Text className="text-[15px] font-medium text-white">{dueDate}</Text>
      </View>
    </View>
  );
}
