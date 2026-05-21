import { Text, View } from "react-native";

type LoanUrgency = "overdue" | "healthy" | "soon";

type LoanHeroCardProps = {
  borrowerName: string;
  amountDue: string;
  statusText: string;
  nextDueDate: string;
  paymentCycle: string;
  urgency: LoanUrgency;
};

const urgencyStyles: Record<LoanUrgency, { shell: string; badge: string; badgeText: string; rail: string }> = {
  overdue: {
    shell: "border-danger/25 bg-danger/10 shadow-danger/10",
    badge: "border-danger/20 bg-danger/10",
    badgeText: "text-danger",
    rail: "bg-danger"
  },
  healthy: {
    shell: "border-mint/20 bg-mint/10 shadow-mint/5",
    badge: "border-mint/20 bg-mint/10",
    badgeText: "text-mint",
    rail: "bg-mint"
  },
  soon: {
    shell: "border-gold/20 bg-gold/10 shadow-gold/5",
    badge: "border-gold/20 bg-gold/10",
    badgeText: "text-gold",
    rail: "bg-gold"
  }
};

export function LoanHeroCard({
  borrowerName,
  amountDue,
  statusText,
  nextDueDate,
  paymentCycle,
  urgency
}: LoanHeroCardProps) {
  const styles = urgencyStyles[urgency];

  return (
    <View className={`overflow-hidden rounded-[28px] border bg-surface/90 p-5 shadow-lg ${styles.shell}`}>
      <View className={`absolute left-0 right-0 top-0 h-0.5 ${styles.rail} opacity-45`} />
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 gap-1">
          <Text className="text-[13px] text-muted">Borrower</Text>
          <Text className="text-[28px] font-semibold leading-9 text-white">{borrowerName}</Text>
        </View>
        <View className={`rounded-full border px-3 py-1 ${styles.badge}`}>
          <Text className={`text-[12px] font-semibold ${styles.badgeText}`}>{statusText}</Text>
        </View>
      </View>

      <View className="mt-8 gap-2">
        <Text className="text-[13px] text-muted">Currently due</Text>
        <Text className="text-[44px] font-semibold leading-[50px] text-white">{amountDue}</Text>
      </View>

      <View className="mt-6 flex-row gap-3">
        <View className="flex-1 rounded-[18px] border border-white/10 bg-white/5 p-4">
          <Text className="text-[12px] text-mutedSoft">Next due</Text>
          <Text className="mt-1 text-[16px] font-semibold text-white">{nextDueDate}</Text>
        </View>
        <View className="flex-1 rounded-[18px] border border-white/10 bg-white/5 p-4">
          <Text className="text-[12px] text-mutedSoft">Cycle</Text>
          <Text className="mt-1 text-[16px] font-semibold text-white">{paymentCycle}</Text>
        </View>
      </View>
    </View>
  );
}
