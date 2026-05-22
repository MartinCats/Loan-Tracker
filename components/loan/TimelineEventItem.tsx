import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

type TimelineTone = "mint" | "gold" | "danger" | "cyan";

type TimelineEventItemProps = {
  title: string;
  subtitle: string;
  amount?: string;
  note?: string | null;
  date: string;
  tone: TimelineTone;
  icon: React.ComponentProps<typeof Ionicons>["name"];
};

const toneClassNames: Record<TimelineTone, { dot: string; shell: string; text: string }> = {
  mint: {
    dot: "bg-mint",
    shell: "border-mint/15 bg-mint/10",
    text: "text-mint"
  },
  gold: {
    dot: "bg-gold",
    shell: "border-gold/15 bg-gold/10",
    text: "text-gold"
  },
  danger: {
    dot: "bg-danger",
    shell: "border-danger/15 bg-danger/10",
    text: "text-danger"
  },
  cyan: {
    dot: "bg-cyan",
    shell: "border-cyan/15 bg-cyan/10",
    text: "text-cyan"
  }
};

export function TimelineEventItem({
  title,
  subtitle,
  amount,
  note,
  date,
  tone,
  icon
}: TimelineEventItemProps) {
  const styles = toneClassNames[tone];

  return (
    <View className="flex-row gap-3">
      <View className="items-center">
        <View className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} />
        <View className="mt-2 w-px flex-1 bg-white/10" />
      </View>

      <View className={`flex-1 rounded-[20px] border p-4 ${styles.shell}`}>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <View className="flex-row items-center gap-2">
              <Ionicons name={icon} size={15} className={styles.text} />
              <Text className="text-[15px] font-semibold text-white">{title}</Text>
            </View>
            <Text className="text-[13px] leading-5 text-muted">{subtitle}</Text>
          </View>
          <Text className="text-[12px] text-mutedSoft">{date}</Text>
        </View>

        {amount ? <Text className={`mt-3 text-[16px] font-semibold ${styles.text}`}>{amount}</Text> : null}
        {note ? (
          <View className="mt-3 rounded-[14px] border border-white/10 bg-black/10 px-3 py-2">
            <Text className="text-[13px] leading-5 text-muted">{note}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
