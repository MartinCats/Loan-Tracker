import { Text, View } from "react-native";

type Urgency = "overdue" | "today" | "upcoming";

type LoanCompactCardProps = {
  amountDue: string;
  borrowerName: string;
  countdownLabel: string;
  countdownValue: string;
  dueDate: string;
  paymentCycle: string;
  principal: string;
  urgency: Urgency;
};

const urgencyStyles: Record<Urgency, { shell: string; badge: string; text: string; rail: string }> = {
  overdue: {
    shell: "border-danger/20 bg-danger/10",
    badge: "border-danger/20 bg-danger/10",
    text: "text-danger",
    rail: "bg-danger"
  },
  today: {
    shell: "border-gold/20 bg-gold/10",
    badge: "border-gold/20 bg-gold/10",
    text: "text-gold",
    rail: "bg-gold"
  },
  upcoming: {
    shell: "border-mint/10 bg-surface/90",
    badge: "border-mint/15 bg-mint/10",
    text: "text-mint",
    rail: "bg-mint"
  }
};

export function LoanCompactCard({
  amountDue,
  borrowerName,
  countdownLabel,
  countdownValue,
  dueDate,
  paymentCycle,
  principal,
  urgency
}: LoanCompactCardProps) {
  const styles = urgencyStyles[urgency];

  return (
    <View className={`overflow-hidden rounded-[22px] border p-4 shadow-lg shadow-black/15 ${styles.shell}`}>
      <View className={`absolute left-0 top-4 h-12 w-0.5 rounded-full ${styles.rail} opacity-60`} />
      <View className="flex-row items-start gap-3">
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-[17px] font-semibold text-white">
            {borrowerName}
          </Text>
          <Text className="mt-1 text-[12px] text-mutedSoft">{paymentCycle}</Text>
          <View className="mt-4 flex-row gap-3">
            <Metric label="Principal" value={principal} />
            <Metric label="Due" value={amountDue} tone="mint" />
          </View>
        </View>

        <View className={`min-w-[72px] items-center rounded-[18px] border px-3 py-2.5 ${styles.badge}`}>
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            className={`text-center text-[18px] font-semibold leading-6 ${styles.text}`}
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

      <View className="mt-4 flex-row items-center justify-between border-t border-white/10 pt-3">
        <Text className="text-[12px] text-muted">Due date</Text>
        <Text className="text-[13px] font-medium text-white">{dueDate}</Text>
      </View>
    </View>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "mint" }) {
  return (
    <View className="min-w-0 flex-1">
      <Text className="text-[11px] text-muted">{label}</Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        className={`mt-1 text-[15px] font-semibold ${tone === "mint" ? "text-mint" : "text-white"}`}
      >
        {value}
      </Text>
    </View>
  );
}
